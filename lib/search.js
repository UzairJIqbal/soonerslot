import { fetchCenterIdsWithSlots, fetchOpenSlots } from "./api.js";
import { MAX_SLOT_REQUESTS } from "./config.js";
import { distanceMiles, lookupCoords } from "./geo.js";
import { nowInZone, searchEndDate, slotMatches } from "./slots.js";

// The centers a search covers, nearest first when we know where home is.
export const pickCenters = async (locations, prefs) => {
	const home =
		prefs.mode === "nearby" && prefs.homeZip
			? await lookupCoords(prefs.homeZip)
			: null;

	const withDistance = locations.map((center) => ({
		...center,
		distance:
			home && center.coords ? Math.round(distanceMiles(home, center.coords)) : null,
	}));

	if (prefs.mode === "centers") {
		const picked = new Set(prefs.centerIds.map(Number));
		return withDistance.filter((center) => picked.has(center.id));
	}

	if (!home) {
		return [];
	}
	return withDistance
		.filter(
			(center) =>
				center.distance !== null &&
				(prefs.radiusMiles === 0 || center.distance <= prefs.radiusMiles),
		)
		.sort((a, b) => a.distance - b.distance);
};

// One nationwide "who has openings" call, then slot details only for the
// covered centers that actually have openings.
export const findMatchingSlots = async (centers, prefs) => {
	const idsWithSlots = await fetchCenterIdsWithSlots(prefs.program);
	const targets = centers
		.filter((center) => idsWithSlots.has(center.id))
		.slice(0, MAX_SLOT_REQUESTS);

	const endDate = searchEndDate(prefs);
	if (endDate < prefs.startDate) {
		return [];
	}

	const matches = [];
	for (const center of targets) {
		const slots = await fetchOpenSlots(center.id, prefs.startDate, endDate);
		const nowLocal = nowInZone(center.tzData);
		for (const slot of slots) {
			if (slotMatches(slot.timestamp, prefs, nowLocal)) {
				matches.push({
					locationId: center.id,
					name: center.name,
					city: center.city,
					state: center.state,
					distance: center.distance,
					timestamp: slot.timestamp,
				});
			}
		}
	}

	return matches.sort(
		(a, b) =>
			a.timestamp.localeCompare(b.timestamp) ||
			(a.distance ?? Infinity) - (b.distance ?? Infinity),
	);
};
