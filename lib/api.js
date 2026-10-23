import { API_BASE } from "./config.js";

const getJSON = async (url) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`CBP's scheduler didn't respond (status ${response.status})`);
	}
	return response.json();
};

export const fetchLocations = (program) =>
	getJSON(
		`${API_BASE}/locations/?temporary=false&inviteOnly=false&operational=true&serviceName=${encodeURIComponent(program)}`,
	);

// One request that lists every center with at least one open slot.
export const fetchCenterIdsWithSlots = async (program) => {
	const data = await getJSON(
		`${API_BASE}/slots/asLocations?minimum=1&limit=500&serviceName=${encodeURIComponent(program)}`,
	);
	return new Set(data.map((loc) => loc.id));
};

export const fetchOpenSlots = async (locationId, startDate, endDate) => {
	const data = await getJSON(
		`${API_BASE}/locations/${locationId}/slots?startTimestamp=${startDate}T00%3A00%3A00&endTimestamp=${endDate}T23%3A59%3A59`,
	);
	return data.filter((slot) => slot.active > 0);
};
