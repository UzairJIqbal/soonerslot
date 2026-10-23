# Chrome Web Store listing

Everything the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) asks for, ready to paste. Keep this file in sync with what is live.

## Package

Upload `dist/soonerslot-<version>.zip`, built with `npm run package`.

## Store listing tab

**Title** comes from `manifest.json`: SoonerSlot – Global Entry & NEXUS Interview Finder (Unofficial)

**Summary** comes from `manifest.json` (125 of 132 characters).

**Category:** Travel

**Language:** English (United States)

**Description:**

```text
SoonerSlot watches the official U.S. Trusted Traveler scheduler and alerts you the minute an earlier interview opens near you.

Global Entry, NEXUS, SENTRI and FAST interviews are often booked months out, but cancellations free up earlier slots all day long, and they're usually gone within minutes. SoonerSlot checks for you once a minute while Chrome is open.

WHAT IT DOES
• Search by distance: enter your ZIP code and a radius, from 25 miles to anywhere in the U.S. Every enrollment center in range is checked, nearest first.
• Or pick up to five specific centers.
• Already booked? Enter your current interview date and you'll only hear about openings before it.
• Filter by day of the week and time of day.
• A notification that stays on screen, an optional chime, and a count on the toolbar icon. One click opens the official scheduler.
• A live board in the popup shows the earliest matching openings with date, time, city and distance.
• Works for Global Entry, NEXUS, SENTRI, FAST (Canada border) and FAST (Mexico border).

PRIVATE BY DESIGN
• No account, no sign-up, no analytics, no tracking.
• Your settings stay in your browser. SoonerSlot never asks for your location; distances are worked out from the ZIP code you type, using a table built into the extension.
• The only site it contacts is the public scheduling API at ttp.cbp.dhs.gov.

POLITE TO THE SCHEDULER
One check per minute, a cap on requests per check, and automatic back-off when the scheduler is having trouble.

SoonerSlot never books anything for you. When a slot opens, you book it yourself on the official site. Tip: stay signed in at ttp.cbp.dhs.gov so you can book fast.

Free and open source: https://github.com/UzairJIqbal/soonerslot

SoonerSlot is an independent project. It is not affiliated with, endorsed by or connected to U.S. Customs and Border Protection (CBP) or the Department of Homeland Security (DHS).
```

**Graphics** (all in this folder):

| Field | File |
|---|---|
| Store icon (128×128) | `images/icon-128.png` |
| Screenshots (1280×800) | `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png` |
| Small promo tile (440×280) | `promo-small-440x280.png` |
| Marquee promo tile (1400×560) | `promo-marquee-1400x560.png` |

**Homepage URL:** https://github.com/UzairJIqbal/soonerslot

**Support URL:** https://github.com/UzairJIqbal/soonerslot/issues

## Privacy tab

**Single purpose:**

```text
SoonerSlot alerts the user when an earlier interview appointment for a U.S. Trusted Traveler program (Global Entry, NEXUS, SENTRI or FAST) becomes available at enrollment centers they choose.
```

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Saves the user's search settings (program, ZIP code, radius, dates, filters) and the latest results locally so they persist between browser sessions. |
| `alarms` | Schedules the once-a-minute check for new appointment openings. Manifest V3 service workers stop when idle, so an alarm is the only reliable way to run a periodic check. |
| `notifications` | Shows a desktop notification when a matching appointment opens. This is the extension's core function. |
| `offscreen` | Plays the optional alert chime. Manifest V3 service workers cannot play audio, so an offscreen document with the AUDIO_PLAYBACK reason is used. |
| Host permission `https://ttp.cbp.dhs.gov/*` | Reads the list of enrollment centers and their open appointment slots from the official public scheduling API. No other site is contacted. |

**Remote code:** No, I am not using remote code. All JavaScript is packaged in the extension.

**Data usage:** tick none of the data types. SoonerSlot collects no user data. The ZIP code the user types is used only on the device to measure distance and is never transmitted.

Then tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/UzairJIqbal/soonerslot/blob/main/PRIVACY.md

## Distribution tab

- **Payments:** Free
- **Visibility:** Public
- **Regions:** All regions (useful anywhere, since NEXUS applicants include Canadians)

# Microsoft Edge Add-ons

Submitted through [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview). The same zip works unchanged. Most of the Chrome copy above carries over; the differences are below.

## Packages

Upload `dist/soonerslot-<version>.zip`.

## Availability

- **Visibility:** Public
- **Markets:** All markets

## Properties

- **Category:** Productivity (Edge has no Travel category)
- **Privacy policy:** Yes, it requires one. URL: https://github.com/UzairJIqbal/soonerslot/blob/main/PRIVACY.md
- **Website URL:** https://github.com/UzairJIqbal/soonerslot
- **Support contact details:** https://github.com/UzairJIqbal/soonerslot/issues
- **Mature content:** No

## Store listings (English)

- **Description:** the same text as the Chrome description above (Edge needs at least 250 characters).
- **Extension logo:** `images/icon-128.png`
- **Small promotional tile:** `promo-small-440x280.png`
- **Large promotional tile:** `promo-marquee-1400x560.png`
- **Screenshots:** `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png`
- **Search terms** (one per box):
  - Global Entry
  - NEXUS
  - SENTRI
  - interview appointment
  - trusted traveler
  - appointment alert
  - CBP scheduler

## Notes for certification

```text
SoonerSlot reads open interview slots from the public U.S. Trusted Traveler scheduling API (ttp.cbp.dhs.gov) once a minute and shows a notification when one matches the user's search. No login or account is needed to test it.

To test: open the popup, choose Global Entry, choose "Near me", enter ZIP code 10001, set "Within" to "Anywhere", and click "Start watching". The board fills with openings within about a minute, and a notification appears.

No data is collected or sent anywhere except requests to ttp.cbp.dhs.gov. Source code: https://github.com/UzairJIqbal/soonerslot
```
