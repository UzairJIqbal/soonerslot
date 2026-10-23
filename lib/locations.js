import { fetchLocations } from "./api.js";
import { LOCATIONS_MAX_AGE_MS } from "./config.js";
import { loadZipTable, normalizePostal } from "./geo.js";

const titleCase = (text) =>
	(text || "")
		.toLowerCase()
		.replace(/\b([a-z])/g, (letter) => letter.toUpperCase());

// The table is keyed by US ZIP, plus a few hand-added non-numeric keys for
// border centers. A foreign 5-digit code (Mexico City's "11500") would
// otherwise collide with an unrelated US ZIP.
const coordsFor = (loc, zipTable) => {
	const key = normalizePostal(loc.postalCode);
	if (loc.countryCode !== "US" && /^\d+$/.test(key)) {
		return null;
	}
	return zipTable[key] ?? null;
};

const toCenter = (loc, zipTable) => ({
	id: loc.id,
	name: (loc.name || "").trim(),
	city: titleCase((loc.city || "").trim()),
	state: (loc.state || loc.countryCode || "").trim(),
	countryCode: loc.countryCode,
	tzData: loc.tzData,
	coords: coordsFor(loc, zipTable),
});

// Enrollment centers for a program, cached in storage for a day.
export const getLocations = async (program, { forceRefresh = false } = {}) => {
	const { locations = {} } = await chrome.storage.local.get("locations");
	const cached = locations[program];
	if (
		!forceRefresh &&
		cached?.list?.length &&
		Date.now() - cached.fetchedAt < LOCATIONS_MAX_AGE_MS
	) {
		return cached.list;
	}

	try {
		const [raw, zipTable] = await Promise.all([
			fetchLocations(program),
			loadZipTable(),
		]);
		const list = raw
			.map((loc) => toCenter(loc, zipTable))
			.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
		await chrome.storage.local.set({
			locations: { ...locations, [program]: { fetchedAt: Date.now(), list } },
		});
		return list;
	} catch (error) {
		// A stale list beats no list when CBP is briefly unavailable.
		if (cached?.list?.length) {
			return cached.list;
		}
		throw error;
	}
};
