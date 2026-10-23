import {
	DAYPARTS,
	DEFAULT_PREFS,
	DEFAULT_STATE,
	MAX_PICKED_CENTERS,
	MAX_SLOT_REQUESTS,
	PROGRAMS,
	RADIUS_OPTIONS,
	SCHEDULER_URL,
} from "../lib/config.js";
import { lookupCoords } from "../lib/geo.js";
import { getLocations } from "../lib/locations.js";
import { pickCenters } from "../lib/search.js";
import { addDaysISO, formatSlot, todayISO } from "../lib/slots.js";

const BOARD_ROWS = 8;
const DEFAULT_WINDOW_DAYS = 90;
// Monday-first display order; values follow Date#getUTCDay (0 = Sunday).
const WEEKDAY_CHIPS = [
	{ value: 1, short: "Mon", label: "Monday" },
	{ value: 2, short: "Tue", label: "Tuesday" },
	{ value: 3, short: "Wed", label: "Wednesday" },
	{ value: 4, short: "Thu", label: "Thursday" },
	{ value: 5, short: "Fri", label: "Friday" },
	{ value: 6, short: "Sat", label: "Saturday" },
	{ value: 0, short: "Sun", label: "Sunday" },
];

const $ = (id) => document.getElementById(id);
const el = {
	statusPill: $("statusPill"),
	statusLine: $("statusLine"),
	slotList: $("slotList"),
	boardEmpty: $("boardEmpty"),
	boardMore: $("boardMore"),
	tip: $("tip"),
	dismissTip: $("dismissTip"),
	form: $("searchForm"),
	settings: $("settings"),
	program: $("program"),
	nearbyFields: $("nearbyFields"),
	homeZip: $("homeZip"),
	homeZipError: $("homeZipError"),
	radius: $("radius"),
	nearbyHint: $("nearbyHint"),
	centerFields: $("centerFields"),
	centerPicker: $("centerPicker"),
	pickedCenters: $("pickedCenters"),
	centersError: $("centersError"),
	startDate: $("startDate"),
	endDate: $("endDate"),
	datesError: $("datesError"),
	currentAppt: $("currentAppt"),
	currentApptError: $("currentApptError"),
	weekdays: $("weekdays"),
	dayparts: $("dayparts"),
	filtersError: $("filtersError"),
	sound: $("sound"),
	pauseAfterAlert: $("pauseAfterAlert"),
	primaryButton: $("primaryButton"),
	bookedButton: $("bookedButton"),
	bookedThanks: $("bookedThanks"),
	reviewLink: $("reviewLink"),
};

let prefs = { ...DEFAULT_PREFS };
let state = { ...DEFAULT_STATE };
let locations = [];
let locationsError = null;

// ---------- storage ----------

const savePrefs = () => chrome.storage.local.set({ prefs });

const updatePrefs = (changes) => {
	prefs = { ...prefs, ...changes };
	savePrefs();
};

// ---------- formatting ----------

const centerLabel = (center) =>
	`${center.city}, ${center.state} (${center.name})`;

const ago = (timestamp) => {
	const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
	if (seconds < 60) {
		return `${seconds}s ago`;
	}
	return `${Math.round(seconds / 60)} min ago`;
};

const minutesUntil = (timestamp) =>
	Math.max(1, Math.ceil((timestamp - Date.now()) / 60000));

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

// ---------- static controls ----------

const fillSelect = (select, options) => {
	select.replaceChildren(
		...options.map(({ value, label }) => {
			const option = document.createElement("option");
			option.value = String(value);
			option.textContent = label;
			return option;
		}),
	);
};

const makeToggle = (label, pressed, onToggle, ariaLabel) => {
	const button = document.createElement("button");
	button.type = "button";
	button.textContent = label;
	if (ariaLabel) {
		button.setAttribute("aria-label", ariaLabel);
	}
	button.setAttribute("aria-pressed", String(pressed));
	button.addEventListener("click", () => {
		const next = button.getAttribute("aria-pressed") !== "true";
		button.setAttribute("aria-pressed", String(next));
		onToggle(next);
	});
	return button;
};

const buildStaticControls = () => {
	fillSelect(
		el.program,
		PROGRAMS.map(({ id, label }) => ({ value: id, label })),
	);
	fillSelect(
		el.radius,
		RADIUS_OPTIONS.map((miles) => ({
			value: miles,
			label: miles === 0 ? "Anywhere" : `${miles} miles`,
		})),
	);

	el.weekdays.replaceChildren(
		...WEEKDAY_CHIPS.map(({ value, short, label }) =>
			makeToggle(
				short,
				prefs.weekdays.includes(value),
				(on) => {
					const days = new Set(prefs.weekdays);
					on ? days.add(value) : days.delete(value);
					updatePrefs({ weekdays: [...days].sort() });
					validateFilters();
				},
				label,
			),
		),
	);

	el.dayparts.replaceChildren(
		...Object.entries(DAYPARTS).map(([key, { label, from, to }]) =>
			makeToggle(
				label,
				prefs.dayparts.includes(key),
				(on) => {
					const parts = new Set(prefs.dayparts);
					on ? parts.add(key) : parts.delete(key);
					updatePrefs({
						dayparts: Object.keys(DAYPARTS).filter((k) => parts.has(k)),
					});
					validateFilters();
				},
				`${label}, ${from}:00 to ${to === 24 ? "midnight" : `${to}:00`}`,
			),
		),
	);
};

const writePrefsToForm = () => {
	el.program.value = prefs.program;
	for (const radio of el.form.elements.mode) {
		radio.checked = radio.value === prefs.mode;
	}
	el.homeZip.value = prefs.homeZip;
	el.radius.value = String(prefs.radiusMiles);
	el.startDate.value = prefs.startDate;
	el.endDate.value = prefs.endDate;
	el.currentAppt.value = prefs.currentAppt;
	el.sound.checked = prefs.sound;
	el.pauseAfterAlert.checked = prefs.pauseAfterAlert;
	el.startDate.min = todayISO();
	el.endDate.min = todayISO();
	el.currentAppt.min = todayISO();
	renderMode();
};

// ---------- where: nearby / centers ----------

const renderMode = () => {
	const nearby = prefs.mode === "nearby";
	el.nearbyFields.hidden = !nearby;
	el.centerFields.hidden = nearby;
};

const renderNearbyHint = async () => {
	if (locationsError) {
		el.nearbyHint.textContent = locationsError;
		return;
	}
	const zip = prefs.homeZip;
	if (!/^\d{5}$/.test(zip) || !locations.length) {
		el.nearbyHint.textContent =
			"We use your ZIP code only to measure distance. It never leaves this browser.";
		return;
	}
	const centers = await pickCenters(locations, prefs);
	if (prefs.homeZip !== zip) {
		return; // a newer keystroke already re-rendered
	}
	if (!(await lookupCoords(zip))) {
		el.nearbyHint.textContent = "";
		return;
	}
	if (centers.length === 0) {
		el.nearbyHint.textContent = `No enrollment centers within ${prefs.radiusMiles} miles. Try a wider radius.`;
		return;
	}
	const closest = centers[0];
	const closestText = `Closest: ${closest.city}, ${closest.state} (${closest.distance} mi).`;
	el.nearbyHint.textContent =
		prefs.radiusMiles === 0
			? `Each check covers the ${MAX_SLOT_REQUESTS} nearest centers that have openings. ${closestText}`
			: `${plural(centers.length, "center")} within ${prefs.radiusMiles} miles. ${closestText}`;
};

const renderCenterPicker = () => {
	const picked = new Set(prefs.centerIds);
	const full = picked.size >= MAX_PICKED_CENTERS;
	const placeholder = locationsError
		? "Centers couldn't load"
		: full
			? `You've picked ${MAX_PICKED_CENTERS} centers`
			: locations.length
				? "Choose a center"
				: "Loading centers…";

	fillSelect(el.centerPicker, [
		{ value: "", label: placeholder },
		...locations
			.filter((center) => !picked.has(center.id))
			.map((center) => ({ value: center.id, label: centerLabel(center) })),
	]);
	el.centerPicker.value = "";
	el.centerPicker.disabled = full || !locations.length;

	const byId = new Map(locations.map((center) => [center.id, center]));
	el.pickedCenters.replaceChildren(
		...prefs.centerIds.map((id) => {
			const center = byId.get(id);
			const item = document.createElement("li");
			const name = document.createElement("span");
			name.textContent = center ? centerLabel(center) : `Center ${id}`;
			const remove = document.createElement("button");
			remove.type = "button";
			remove.textContent = "×";
			remove.setAttribute("aria-label", `Remove ${name.textContent}`);
			remove.addEventListener("click", () => {
				updatePrefs({ centerIds: prefs.centerIds.filter((c) => c !== id) });
				renderCenterPicker();
			});
			item.append(name, remove);
			return item;
		}),
	);
	if (locationsError) {
		showError(el.centersError, locationsError);
	}
};

const loadLocations = async () => {
	const program = prefs.program;
	locations = [];
	locationsError = null;
	renderCenterPicker();
	try {
		const list = await getLocations(program);
		if (program !== prefs.program) {
			return;
		}
		locations = list;
	} catch {
		locationsError =
			"Couldn't load enrollment centers from CBP. Close and reopen SoonerSlot to try again.";
	}
	// Centers differ by program, so drop picks that this program doesn't offer.
	const available = new Set(locations.map((center) => center.id));
	if (locations.length && prefs.centerIds.some((id) => !available.has(id))) {
		updatePrefs({ centerIds: prefs.centerIds.filter((id) => available.has(id)) });
	}
	renderCenterPicker();
	renderNearbyHint();
};

// ---------- validation ----------

const showError = (node, message, field) => {
	node.textContent = message || "";
	node.hidden = !message;
	if (field) {
		field.setAttribute("aria-invalid", String(Boolean(message)));
	}
	return !message;
};

const validateWhere = async () => {
	if (prefs.mode === "nearby") {
		showError(el.centersError, "");
		if (!/^\d{5}$/.test(prefs.homeZip)) {
			return showError(el.homeZipError, "Enter a 5-digit ZIP code.", el.homeZip);
		}
		if (!(await lookupCoords(prefs.homeZip))) {
			return showError(
				el.homeZipError,
				"We don't recognize that ZIP code. Try a nearby one.",
				el.homeZip,
			);
		}
		return showError(el.homeZipError, "", el.homeZip);
	}
	showError(el.homeZipError, "", el.homeZip);
	if (locationsError) {
		return showError(el.centersError, locationsError);
	}
	return showError(
		el.centersError,
		prefs.centerIds.length ? "" : "Pick at least one enrollment center.",
	);
};

const validateDates = () => {
	const today = todayISO();
	let datesMessage = "";
	if (!prefs.startDate || !prefs.endDate) {
		datesMessage = "Choose both a start and an end date.";
	} else if (prefs.startDate < today) {
		datesMessage = "The start date can't be in the past.";
	} else if (prefs.endDate < prefs.startDate) {
		datesMessage = "The end date must be on or after the start date.";
	}
	const datesOk = showError(el.datesError, datesMessage);
	el.startDate.setAttribute("aria-invalid", String(!datesOk));
	el.endDate.setAttribute("aria-invalid", String(!datesOk));

	const apptOk = showError(
		el.currentApptError,
		prefs.currentAppt && prefs.startDate && prefs.currentAppt <= prefs.startDate
			? "Your current interview must be after the start date, or there's nothing earlier to find."
			: "",
		el.currentAppt,
	);
	return datesOk && apptOk;
};

const validateFilters = () => {
	let message = "";
	if (!prefs.weekdays.length) {
		message = "Pick at least one day.";
	} else if (!prefs.dayparts.length) {
		message = "Pick at least one time of day.";
	}
	return showError(el.filtersError, message);
};

const validateAll = async () => {
	const results = [await validateWhere(), validateDates(), validateFilters()];
	return results.every(Boolean);
};

// ---------- state: status, board, button ----------

const renderStatus = () => {
	const running = state.isRunning;
	let pill = "stopped";
	let pillText = "Stopped";
	if (running && state.lastError) {
		pill = "error";
		pillText = "Retrying";
	} else if (running) {
		pill = "running";
		pillText = "Watching";
	} else if (state.pausedAfterAlert) {
		pill = "paused";
		pillText = "Paused";
	}
	el.statusPill.dataset.state = pill;
	el.statusPill.textContent = pillText;

	let line = "";
	if (running && state.lastError && state.nextCheckAt > Date.now()) {
		line = `Next try in ${minutesUntil(state.nextCheckAt)} min`;
	} else if (running && state.lastCheckedAt) {
		line = `${plural(state.centersWatched, "center")}, checked ${ago(state.lastCheckedAt)}`;
	} else if (running) {
		line = "Checking…";
	} else if (state.pausedAfterAlert) {
		line = "Paused after an alert";
	}
	el.statusLine.textContent = line;
};

const renderBoard = () => {
	const shown = state.matches.slice(0, BOARD_ROWS);
	el.slotList.replaceChildren(
		...shown.map((match) => {
			const { date, time } = formatSlot(match.timestamp);
			const link = document.createElement("a");
			link.href = SCHEDULER_URL;
			link.target = "_blank";
			link.rel = "noopener";
			const cells = [
				["date", date],
				["time", time],
				["place", `${match.city}, ${match.state}`],
				["dist", match.distance === null ? "" : `${match.distance} mi`],
			];
			for (const [className, text] of cells) {
				const cell = document.createElement("span");
				cell.className = className;
				cell.textContent = text;
				link.append(cell);
			}
			link.title = `${match.name}. Open the CBP scheduler to book.`;
			const item = document.createElement("li");
			item.append(link);
			return item;
		}),
	);

	const extra = state.matchCount - shown.length;
	el.boardMore.hidden = extra <= 0;
	el.boardMore.textContent =
		extra > 0 ? `${plural(extra, "more opening")} match your search.` : "";

	let empty = "";
	if (state.isRunning && state.lastError) {
		empty = `${state.lastError}. SoonerSlot will keep trying.`;
	} else if (shown.length) {
		empty = "";
	} else if (state.isRunning && !state.lastCheckedAt) {
		empty = "Checking CBP for openings…";
	} else if (state.isRunning) {
		empty =
			"No openings match yet. You'll get an alert the moment one appears.";
	} else if (state.pausedAfterAlert) {
		empty =
			"SoonerSlot stopped after alerting you. Start watching again if that slot was gone.";
	} else {
		empty =
			"Set your search below and start watching. SoonerSlot checks every minute while Chrome is open.";
	}
	el.boardEmpty.textContent = empty;
	el.boardEmpty.hidden = !empty;
};

const renderRunning = () => {
	el.settings.disabled = state.isRunning;
	el.primaryButton.textContent = state.isRunning ? "Stop watching" : "Start watching";
	el.primaryButton.dataset.action = state.isRunning ? "stop" : "start";
};

const renderState = () => {
	renderStatus();
	renderBoard();
	renderRunning();
};

const send = (message) =>
	chrome.runtime.sendMessage(message).catch(() => {
		// The background doesn't reply; a closed port here is expected.
	});

// ---------- events ----------

const bindEvents = () => {
	el.program.addEventListener("change", () => {
		updatePrefs({ program: el.program.value });
		loadLocations();
	});

	for (const radio of el.form.elements.mode) {
		radio.addEventListener("change", () => {
			updatePrefs({ mode: radio.value });
			renderMode();
			showError(el.homeZipError, "", el.homeZip);
			showError(el.centersError, "");
		});
	}

	el.homeZip.addEventListener("input", () => {
		const zip = el.homeZip.value.replace(/\D/g, "").slice(0, 5);
		el.homeZip.value = zip;
		updatePrefs({ homeZip: zip });
		showError(el.homeZipError, "", el.homeZip);
		renderNearbyHint();
	});

	el.radius.addEventListener("change", () => {
		updatePrefs({ radiusMiles: Number(el.radius.value) });
		renderNearbyHint();
	});

	el.centerPicker.addEventListener("change", () => {
		const id = Number(el.centerPicker.value);
		if (id && prefs.centerIds.length < MAX_PICKED_CENTERS) {
			updatePrefs({ centerIds: [...prefs.centerIds, id] });
			showError(el.centersError, "");
		}
		renderCenterPicker();
	});

	for (const [input, key] of [
		[el.startDate, "startDate"],
		[el.endDate, "endDate"],
		[el.currentAppt, "currentAppt"],
	]) {
		input.addEventListener("change", () => {
			updatePrefs({ [key]: input.value });
			validateDates();
		});
	}

	el.sound.addEventListener("change", () => updatePrefs({ sound: el.sound.checked }));
	el.pauseAfterAlert.addEventListener("change", () =>
		updatePrefs({ pauseAfterAlert: el.pauseAfterAlert.checked }),
	);

	el.form.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (state.isRunning) {
			send({ event: "stop" });
			return;
		}
		if (await validateAll()) {
			el.bookedThanks.hidden = true;
			send({ event: "start", prefs });
		} else {
			el.form.querySelector('[aria-invalid="true"], .error:not([hidden])')
				?.scrollIntoView({ block: "center", behavior: "smooth" });
		}
	});

	el.dismissTip.addEventListener("click", () => {
		el.tip.hidden = true;
		chrome.storage.local.set({ ui: { tipDismissed: true } });
	});

	el.bookedButton.addEventListener("click", () => {
		if (state.isRunning) {
			send({ event: "stop" });
		}
		el.reviewLink.href = `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
		el.bookedThanks.hidden = false;
	});

	chrome.storage.onChanged.addListener((changes, area) => {
		if (area !== "local") {
			return;
		}
		if (changes.state) {
			state = { ...DEFAULT_STATE, ...changes.state.newValue };
			renderState();
		}
	});

	// Keeps "checked 14s ago" honest while the popup is open.
	setInterval(renderStatus, 1000);
};

// ---------- start ----------

const init = async () => {
	const stored = await chrome.storage.local.get(["prefs", "state", "ui"]);
	prefs = { ...DEFAULT_PREFS, ...stored.prefs };
	state = { ...DEFAULT_STATE, ...stored.state };

	// Fresh installs and stale searches get a sensible window starting today.
	const today = todayISO();
	if (!state.isRunning) {
		if (!prefs.startDate || prefs.startDate < today) {
			prefs.startDate = today;
		}
		if (!prefs.endDate || prefs.endDate < prefs.startDate) {
			prefs.endDate = addDaysISO(prefs.startDate, DEFAULT_WINDOW_DAYS);
		}
		if (prefs.currentAppt && prefs.currentAppt < today) {
			prefs.currentAppt = "";
		}
		savePrefs();
	}

	el.tip.hidden = Boolean(stored.ui?.tipDismissed);
	buildStaticControls();
	writePrefsToForm();
	bindEvents();
	renderState();
	loadLocations();
};

init();
