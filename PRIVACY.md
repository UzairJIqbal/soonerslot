# Privacy Policy

**SoonerSlot – Global Entry & NEXUS Interview Finder (Unofficial)**
Effective date: October 23, 2026

SoonerSlot is built so that it doesn't need your personal information. This policy explains exactly what the extension stores and what it sends over the network.

## What SoonerSlot stores

All of the following is saved only in your own browser, using Chrome's extension storage (`chrome.storage.local`). It is never sent to the developer or to anyone else.

- Your search settings: program, home ZIP code, search radius or chosen enrollment centers, date range, the date of an interview you already have (if you enter one), day and time filters, and alert preferences.
- The latest search results: matching openings, when the last check ran, and any error message from that check.
- A list of openings you've already been alerted about, so you aren't alerted twice.
- A cached copy of the public list of enrollment centers, refreshed daily.

Removing the extension deletes all of this.

## What SoonerSlot sends over the network

SoonerSlot makes requests only to U.S. Customs and Border Protection's public scheduling service at `https://ttp.cbp.dhs.gov`. These requests ask for the list of enrollment centers and their open interview slots. They contain the program name, enrollment center IDs and date ranges. They do **not** contain your ZIP code, your name, your Trusted Traveler account details or any other personal information.

Your ZIP code is used only inside your browser, to calculate the distance to each enrollment center from a table bundled with the extension.

Like any website request, CBP's servers can see your IP address when SoonerSlot contacts them. SoonerSlot doesn't control how CBP handles that information.

## What SoonerSlot does not do

- No accounts, sign-ups or logins.
- No analytics, telemetry, advertising or tracking.
- No reading of your browsing history, open tabs or the content of web pages.
- No access to your Trusted Traveler Programs account. SoonerSlot never signs in or books anything on your behalf.
- No selling, renting or sharing of data, because the developer never receives any.

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Save your settings and results in your browser. |
| `alarms` | Run a check once a minute while you're watching. |
| `notifications` | Show an alert when a matching slot opens. |
| `offscreen` | Play the alert sound. |
| Access to `ttp.cbp.dhs.gov` | Read enrollment centers and open slots from CBP's public scheduler. |

## Children

SoonerSlot isn't directed at children under 13 and doesn't knowingly collect information from anyone.

## Changes

If this policy changes, the updated version will be published at this address with a new effective date. Material changes will also be noted in the [changelog](CHANGELOG.md).

## Contact

Questions about privacy can be raised by opening an issue at <https://github.com/UzairJIqbal/soonerslot/issues>.

SoonerSlot is not affiliated with U.S. Customs and Border Protection or the Department of Homeland Security.
