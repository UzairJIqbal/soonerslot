let zipTablePromise = null;

// ZIP -> [lat, lon], built by tools/build-zip-table.py.
export const loadZipTable = () => {
	zipTablePromise ??= fetch(chrome.runtime.getURL("data/zips.json")).then(
		(response) => response.json(),
	);
	return zipTablePromise;
};

export const normalizePostal = (postalCode) =>
	(postalCode || "").toUpperCase().replace(/\s/g, "").slice(0, 5);

export const lookupCoords = async (postalCode) => {
	const table = await loadZipTable();
	return table[normalizePostal(postalCode)] ?? null;
};

const toRadians = (deg) => (deg * Math.PI) / 180;

export const distanceMiles = ([lat1, lon1], [lat2, lon2]) => {
	const earthRadiusMiles = 3958.8;
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * earthRadiusMiles * Math.asin(Math.sqrt(a));
};
