const chime = new Audio(chrome.runtime.getURL("sounds/chime.wav"));

chrome.runtime.onMessage.addListener((message) => {
	if (message?.target === "offscreen" && message.event === "playSound") {
		chime.currentTime = 0;
		chime.play().catch((error) => console.error(error));
	}
});
