import { formatSlot } from "./slots.js";

const OFFSCREEN_URL = "offscreen/offscreen.html";

export const showSlotNotification = (earliest, newCount) => {
	const { date, time } = formatSlot(earliest.timestamp);
	const distance = earliest.distance !== null ? `, ${earliest.distance} mi away` : "";
	const more =
		newCount > 1
			? `${newCount - 1} more new opening${newCount === 2 ? "" : "s"} in SoonerSlot`
			: "Openings go fast. Book now.";

	chrome.notifications.create(`slot-${Date.now()}`, {
		type: "basic",
		iconUrl: "images/icon-128.png",
		title: `Interview open in ${earliest.city}, ${earliest.state}`,
		message: `${date} at ${time}${distance}`,
		contextMessage: more,
		priority: 2,
		requireInteraction: true,
		buttons: [{ title: "Open CBP scheduler" }],
	});
};

// Service workers can't play audio, so a hidden offscreen page does it.
export const playAlertSound = async () => {
	try {
		if (!(await chrome.offscreen.hasDocument())) {
			await chrome.offscreen.createDocument({
				url: OFFSCREEN_URL,
				reasons: ["AUDIO_PLAYBACK"],
				justification: "Play an alert sound when an interview slot opens.",
			});
		}
		await chrome.runtime.sendMessage({ target: "offscreen", event: "playSound" });
	} catch (error) {
		console.log(error);
	}
};
