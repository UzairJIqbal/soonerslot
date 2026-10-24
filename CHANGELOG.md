# Changelog

All notable changes to SoonerSlot are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] – 2026-10-23

First public release, available on the [Microsoft Edge Add-ons store](https://microsoftedge.microsoft.com/addons/detail/jjljahhpphkoeggpmihfokhcldhpblon).

### Added

- Search by distance: enter a ZIP code and a radius (25–500 miles, or anywhere), and SoonerSlot watches every enrollment center in range, nearest first.
- Search up to five specific enrollment centers.
- Support for Global Entry, NEXUS, SENTRI, FAST (Canada border) and FAST (Mexico border).
- "Already booked?" filter that alerts only for openings earlier than an existing interview.
- Weekday and time-of-day filters.
- Persistent notifications with a button that opens the CBP scheduler, an optional chime, and a toolbar badge with the number of matching openings.
- Live board of the earliest matching openings in the popup, with the time of the last check.
- Option to stop watching after the first alert.
- Automatic back-off when CBP's scheduler returns errors, with the retry time shown in the popup.
- Light and dark themes that follow the system setting.

### Changed

- Rebuilt from the original single-center prototype on Manifest V3 modules. All state now lives in `chrome.storage.local`, so checks survive the service worker shutting down.
- Slot times are compared and displayed in each center's own time zone.

[1.0.0]: https://github.com/UzairJIqbal/soonerslot/releases/tag/v1.0.0
