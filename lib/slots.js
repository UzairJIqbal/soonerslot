import { DAYPARTS } from "./config.js";

// Slot timestamps are the center's local wall-clock time ("2026-10-28T09:15"),
// so all comparisons below work on those strings / parts, never on Date
// objects in the browser's own zone.

const parseTimestamp = (timestamp) => {
	const [datePart, timePart = "00:00"] = timestamp.split("T");
	const [year, month, day] = datePart.split("-").map(Number);
	const [hour, minute] = timePart.split(":").map(Number);
	return { datePart, year, month, day, hour, minute };
};

const toUTCDate = ({ year, month, day, hour, minute }) =>
	new Date(Date.UTC(year, month - 1, day, hour, minute));

// Current wall-clock time in a center's zone, as "YYYY-MM-DDTHH:MM".
export const nowInZone = (timeZone) => {
	let parts;
	try {
		parts = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		}).formatToParts(new Date());
	} catch {
		return nowInZone(undefined);
	}
	const get = (type) => parts.find((part) => part.type === type).value;
	return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

export const todayISO = () => {
	const now = new Date();
	const offset = now.getTimezoneOffset() * 60000;
	return new Date(now - offset).toISOString().slice(0, 10);
};

export const addDaysISO = (isoDate, days) => {
	const date = new Date(`${isoDate}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
};

// Last day worth searching: the end date, or the day before an existing
// appointment if that's sooner.
export const searchEndDate = (prefs) => {
	if (prefs.currentAppt) {
		const dayBefore = addDaysISO(prefs.currentAppt, -1);
		return dayBefore < prefs.endDate ? dayBefore : prefs.endDate;
	}
	return prefs.endDate;
};

export const slotMatches = (timestamp, prefs, nowLocal) => {
	if (timestamp <= nowLocal) {
		return false;
	}
	const parsed = parseTimestamp(timestamp);
	if (parsed.datePart < prefs.startDate || parsed.datePart > searchEndDate(prefs)) {
		return false;
	}
	if (!prefs.weekdays.includes(toUTCDate(parsed).getUTCDay())) {
		return false;
	}
	return prefs.dayparts.some((key) => {
		const { from, to } = DAYPARTS[key];
		return parsed.hour >= from && parsed.hour < to;
	});
};

export const formatSlot = (timestamp) => {
	const date = toUTCDate(parseTimestamp(timestamp));
	return {
		date: date.toLocaleDateString(undefined, {
			timeZone: "UTC",
			weekday: "short",
			month: "short",
			day: "numeric",
		}),
		time: date.toLocaleTimeString(undefined, {
			timeZone: "UTC",
			hour: "numeric",
			minute: "2-digit",
		}),
	};
};

export const slotKey = (match) => `${match.locationId}|${match.timestamp}`;
