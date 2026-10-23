export const API_BASE = "https://ttp.cbp.dhs.gov/schedulerapi";
export const SCHEDULER_URL =
	"https://ttp.cbp.dhs.gov/schedulerui/schedule-interview";

export const ALARM_NAME = "SOONERSLOT_CHECK";
export const CHECK_PERIOD_MINUTES = 1;

// CBP "serviceName" values. Labels are what users see.
export const PROGRAMS = [
	{ id: "Global Entry", label: "Global Entry" },
	{ id: "NEXUS", label: "NEXUS" },
	{ id: "SENTRI", label: "SENTRI" },
	{ id: "U.S. / Canada FAST", label: "FAST (Canada border)" },
	{ id: "U.S. / Mexico FAST", label: "FAST (Mexico border)" },
];

export const RADIUS_OPTIONS = [25, 50, 100, 250, 500, 0]; // 0 = anywhere
export const MAX_PICKED_CENTERS = 5;
// Per-check cap on slot requests, to stay polite to CBP's API.
export const MAX_SLOT_REQUESTS = 10;
export const MAX_STORED_MATCHES = 50;
export const LOCATIONS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Weekday numbers follow Date#getUTCDay: 0 = Sunday.
export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
export const DAYPARTS = {
	morning: { label: "Morning", from: 0, to: 12 },
	afternoon: { label: "Afternoon", from: 12, to: 17 },
	evening: { label: "Evening", from: 17, to: 24 },
};

export const DEFAULT_PREFS = {
	program: "Global Entry",
	mode: "nearby", // "nearby" | "centers"
	homeZip: "",
	radiusMiles: 100,
	centerIds: [],
	startDate: "",
	endDate: "",
	currentAppt: "",
	weekdays: ALL_WEEKDAYS,
	dayparts: Object.keys(DAYPARTS),
	sound: true,
	pauseAfterAlert: false,
};

export const DEFAULT_STATE = {
	isRunning: false,
	pausedAfterAlert: false,
	lastCheckedAt: null,
	lastError: null,
	consecutiveErrors: 0,
	nextCheckAt: 0,
	centersWatched: 0,
	matches: [],
	matchCount: 0,
	notifiedKeys: [],
};
