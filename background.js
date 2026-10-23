import {
	ALARM_NAME,
	CHECK_PERIOD_MINUTES,
	DEFAULT_PREFS,
	DEFAULT_STATE,
	MAX_STORED_MATCHES,
	SCHEDULER_URL,
} from "./lib/config.js";
import { getLocations } from "./lib/locations.js";
import { playAlertSound, showSlotNotification } from "./lib/notify.js";
import { findMatchingSlots, pickCenters } from "./lib/search.js";
import { slotKey } from "./lib/slots.js";

// MV3 service workers are shut down when idle, so prefs and state live in
// chrome.storage.local rather than in module-level variables.

const MAX_NOTIFIED_KEYS = 500;
const MAX_BACKOFF_MINUTES = 30;
const LEGACY_KEYS = [
	"locationID",
	"startDate",
	"endDate",
	"tzData",
	"isRunning",
	"lastNotifiedTimestamp",
];

let checkInProgress = false;

const getPrefs = async () => {
	const { prefs } = await chrome.storage.local.get("prefs");
	return { ...DEFAULT_PREFS, ...prefs };
};

const getState = async () => {
	const { state } = await chrome.storage.local.get("state");
	return { ...DEFAULT_STATE, ...state };
};

const updateState = async (changes) => {
	const state = await getState();
	const next = { ...state, ...changes };
	await chrome.storage.local.set({ state: next });
	return next;
};

const setBadge = (text, color = "#1f6f4a") => {
	chrome.action.setBadgeText({ text });
	if (text) {
		chrome.action.setBadgeBackgroundColor({ color });
	}
};

const ensureAlarm = async () => {
	const alarm = await chrome.alarms.get(ALARM_NAME);
	if (!alarm) {
		await chrome.alarms.create(ALARM_NAME, {
			periodInMinutes: CHECK_PERIOD_MINUTES,
		});
	}
};

const startWatching = async (prefs) => {
	await chrome.storage.local.set({ prefs: { ...DEFAULT_PREFS, ...prefs } });
	await updateState({
		...DEFAULT_STATE,
		isRunning: true,
	});
	setBadge("");
	await ensureAlarm();
	await runCheck();
};

const stopWatching = async ({ pausedAfterAlert = false } = {}) => {
	await chrome.alarms.clear(ALARM_NAME);
	await updateState({ isRunning: false, pausedAfterAlert, nextCheckAt: 0 });
	if (!pausedAfterAlert) {
		setBadge("");
	}
};

const alertOnNewMatches = async (matches, state, prefs) => {
	const notified = new Set(state.notifiedKeys);
	const fresh = matches.filter((match) => !notified.has(slotKey(match)));
	const notifiedKeys = [
		...matches.map(slotKey),
		...state.notifiedKeys,
	].slice(0, MAX_NOTIFIED_KEYS);

	if (fresh.length > 0) {
		showSlotNotification(fresh[0], fresh.length);
		if (prefs.sound) {
			playAlertSound();
		}
	}
	return { notifiedKeys, alerted: fresh.length > 0 };
};

const runCheck = async () => {
	if (checkInProgress) {
		return;
	}
	checkInProgress = true;
	try {
		const state = await getState();
		if (!state.isRunning || Date.now() < state.nextCheckAt) {
			return;
		}
		const prefs = await getPrefs();

		try {
			const locations = await getLocations(prefs.program);
			const centers = await pickCenters(locations, prefs);
			const matches = await findMatchingSlots(centers, prefs);

			// Stop may have been pressed while requests were in flight.
			if (!(await getState()).isRunning) {
				return;
			}

			const { notifiedKeys, alerted } = await alertOnNewMatches(
				matches,
				state,
				prefs,
			);
			await updateState({
				lastCheckedAt: Date.now(),
				lastError: null,
				consecutiveErrors: 0,
				nextCheckAt: 0,
				centersWatched: centers.length,
				matches: matches.slice(0, MAX_STORED_MATCHES),
				matchCount: matches.length,
				notifiedKeys,
			});
			setBadge(matches.length > 0 ? String(Math.min(matches.length, 99)) : "");

			if (alerted && prefs.pauseAfterAlert) {
				await stopWatching({ pausedAfterAlert: true });
			}
		} catch (error) {
			const consecutiveErrors = state.consecutiveErrors + 1;
			const backoffMinutes = Math.min(
				2 ** (consecutiveErrors - 1),
				MAX_BACKOFF_MINUTES,
			);
			await updateState({
				lastCheckedAt: Date.now(),
				lastError: error.message || "Couldn't reach CBP's scheduler",
				consecutiveErrors,
				nextCheckAt:
					consecutiveErrors > 1 ? Date.now() + backoffMinutes * 60000 : 0,
			});
			setBadge("!", "#b4561b");
		}
	} finally {
		checkInProgress = false;
	}
};

const openScheduler = () => {
	chrome.tabs.create({ url: SCHEDULER_URL });
};

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	await chrome.storage.local.remove(LEGACY_KEYS);
	if (reason === "install") {
		await chrome.storage.local.set({
			prefs: DEFAULT_PREFS,
			state: DEFAULT_STATE,
		});
	}
	if ((await getState()).isRunning) {
		await ensureAlarm();
	}
});

chrome.runtime.onStartup.addListener(async () => {
	if ((await getState()).isRunning) {
		await ensureAlarm();
	}
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === ALARM_NAME) {
		runCheck();
	}
});

chrome.notifications.onClicked.addListener((notificationId) => {
	openScheduler();
	chrome.notifications.clear(notificationId);
});

chrome.notifications.onButtonClicked.addListener((notificationId) => {
	openScheduler();
	chrome.notifications.clear(notificationId);
});

chrome.runtime.onMessage.addListener((message) => {
	if (message?.target === "offscreen") {
		return;
	}
	switch (message?.event) {
		case "start":
			startWatching(message.prefs);
			break;
		case "stop":
			stopWatching();
			break;
		default:
			break;
	}
});
