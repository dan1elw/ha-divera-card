# DIVERA Card Simulator

A standalone browser-based preview tool for the `divera-alarm-card` Lovelace card.
Use it to inspect how the card looks and behaves **without a running Home Assistant instance**.

## Opening the simulator

No build step or local server is required. Open the file directly in any modern browser:

```bash
xdg-open simulator.html        # Linux
open simulator.html             # macOS
# or drag the file into your browser
```

> The map section requires an internet connection to load OpenStreetMap tiles.
> All other card sections work fully offline.

## How it works

The simulator loads the real card implementation from
`custom_components/divera/www/divera-card.js` via a `<script>` tag on every page load.
It then creates a mock Home Assistant `hass` object with pre-defined entity states and
passes it to the card element — exactly as Home Assistant would at runtime.

**Changes to `divera-card.js` are reflected immediately after a browser refresh.**
No build step, no caching, no snapshot.

## UI overview

### Scenarios

Four preset alarm states that populate the mock entity data:

| Button             | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| Kein Einsatz       | No active alarm — idle/ready state                           |
| Brand in Gebäude   | High-priority alarm with address and map coordinates         |
| Hilfeleistung      | Standard-priority alarm (VU) with address and coordinates    |
| Einsatz (kein Ort) | Active alarm without GPS coordinates (map placeholder shown) |

### Display toggles

| Toggle             | Effect                                          |
| ------------------ | ----------------------------------------------- |
| Karte anzeigen     | Shows/hides the embedded OpenStreetMap section  |
| Fahrzeuge anzeigen | Shows/hides the vehicle FMS grid                |
| Eigener Status     | Shows/hides the personal availability bar       |
| Helles Theme       | Switches between dark (default) and light theme |

### Configuration inputs

- **Kartenname** — sets the card title (top-left, default: `DIVERA 24/7`)
- **Einheit** — sets the unit name shown below the title (default: `FF Musterstadt`)

### Eigener Status (own availability)

Dropdown to switch between available Divera status values. The options shown in the simulator mirror a sample unit configuration — your actual unit may use different labels and IDs, as these are fully configurable in Divera.

Example values used in the simulator:

| Label               | Description              |
| ------------------- | ------------------------ |
| Außer Dienst        | Off duty                 |
| Komme nicht         | Not coming               |
| Nicht einsatzbereit | Not ready for deployment |
| FEZ / Stab          | Command staff            |
| Komme               | Coming                   |
| Einsatzbereit       | Ready (default)          |
| 1 std. Vorlauf      | 1 hour lead time         |
| Vorlauf 1 std.      | Lead time 1 hour         |

### Fahrzeug-FMS

Individual FMS (Fahrzeugmanagement-System) state selector per vehicle.
The colored dot updates in the sidebar immediately when the selection changes.

| FMS | Meaning             | Color  |
| --- | ------------------- | ------ |
| S1  | frei Funk           | Green  |
| S2  | auf Wache           | Green  |
| S3  | Einsatz             | Orange |
| S4  | am Einsatzort       | Red    |
| S5  | Sprechwunsch        | Blue   |
| S6  | nicht einsatzbereit | Grey   |

## Mock vehicle fleet

The simulator includes four example vehicles that mirror the naming convention of integration-provided vehicle entities:

| Entity ID                  | Kurzname | Typ                         |
| -------------------------- | -------- | --------------------------- |
| `sensor.divera_fahrzeug_1` | HLF 20   | Hilfeleistungslöschfahrzeug |
| `sensor.divera_fahrzeug_2` | LF 10    | Löschfahrzeug               |
| `sensor.divera_fahrzeug_3` | TLF 3000 | Tanklöschfahrzeug           |
| `sensor.divera_fahrzeug_4` | ELW      | Einsatzleitwagen            |

## Development workflow

1. Edit `custom_components/divera/www/divera-card.js`
2. Refresh the simulator in the browser
3. Use the scenario and toggle controls to verify all states look correct
4. Merge / deploy when satisfied
