# DIVERA 24/7 — Home Assistant Integration & Dashboard Setup Guide

## Überblick

Diese Anleitung beschreibt die vollständige Einrichtung einer DIVERA 24/7 Anbindung in Home Assistant mit einem maßgeschneiderten Alarm-Dashboard. Die Lösung umfasst den Alarmstatus, Fahrzeugstatus (FMS), persönlichen Verfügbarkeitsstatus und eine Kartenansicht des Einsatzortes.

**Architektur:**

```
DIVERA 24/7 Cloud API
        │
        ▼
dan1elw/ha-divera-card  (HACS Custom Integration)
        │
        ├── sensor.divera_last_alarm         → Alarmdetails
        ├── sensor.divera_last_alarm_id      → Alarm-ID
        ├── sensor.divera_status             → Eigener Status
        └── (weitere Entities je nach Einheit)
        │
        ▼
REST Sensor (command_line)                  → Fahrzeugstatus
        │
        ▼
divera-card.js                              → Custom Lovelace Card (automatisch geladen)
```

---

## Schritt 1: HACS Integration installieren

### Voraussetzungen

- Home Assistant Core ≥ 2024.1
- HACS (Home Assistant Community Store) installiert
- DIVERA 24/7 Account mit Access-Key (Verwaltung → Einstellungen → Schnittstellen → API)

### Installation über HACS

1. HACS öffnen → **Integrationen** → Drei-Punkte-Menü → **Benutzerdefinierte Repositories**
2. URL eingeben: `https://github.com/dan1elw/ha-divera-card`
3. Kategorie: **Integration** → Hinzufügen
4. Integration suchen: "Divera 24/7" → **Herunterladen**
5. Home Assistant **neustarten**

### Alternativ: Manuelle Installation

```bash
cd /config
mkdir -p custom_components/divera
cd custom_components/divera
wget https://github.com/dan1elw/ha-divera-card/releases/latest/download/divera.zip
unzip divera.zip
rm divera.zip
```

### Konfiguration

1. Einstellungen → Geräte & Dienste → **Integration hinzufügen** → "Divera 24/7"
2. **Access-Key** eingeben (persönlicher oder System-Benutzer Key)
3. **Einheit(en)** auswählen

> **Hinweis zum Access-Key:**
>
> - Persönlicher Key: Zeigt nur eigene Daten, setzt eigenen Status
> - System-Benutzer Key: Kann Daten aller Nutzer abrufen (Verwaltung → Schnittstellen → System-Benutzer)
> - Für das Dashboard empfohlen: **Persönlicher Key** (DSGVO-konform, reicht für Alarm + eigenen Status)

---

## Schritt 2: Fahrzeugstatus via REST Sensor

Die HACS-Integration deckt Fahrzeugstatus möglicherweise nicht vollständig ab. Ergänze diese REST Sensoren in deiner `configuration.yaml`:

```yaml
# ============================================================
# DIVERA 24/7 — Fahrzeugstatus Sensoren
# ============================================================
# Ersetze YOUR-ACCESS-KEY-HERE mit deinem Divera Access-Key

command_line:
  - sensor:
      name: divera_vehicle_raw
      command: >-
        curl -s -X GET
        "https://www.divera247.com/api/v2/pull/vehicle-status?accesskey=YOUR-ACCESS-KEY-HERE"
      scan_interval: 120
      value_template: '{{ value_json["success"] }}'
      json_attributes:
        - data

# Template-Sensoren für einzelne Fahrzeuge
# Erstelle einen Sensor pro Fahrzeug. Passe den Array-Index [0], [1], etc. an.

template:
  - sensor:
      # --- Fahrzeug 1 ---
      - name: "Divera Fahrzeug 1"
        unique_id: divera_vehicle_0
        state: >-
          {% set values = ['funkfrei','auf Wache','Einsatz übernommen','Einsatzstelle an','Sprechwunsch','nicht einsatzbereit'] %}
          {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
          {% if data and data | length > 0 %}
            {% set status = data[0]['fmsstatus'] | int - 1 %}
            {{ values[status] if status in range(values | length) else 'unbekannt' }}
          {% else %}
            unbekannt
          {% endif %}
        attributes:
          shortname: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[0]['shortname'] if data and data | length > 0 else 'N/A' }}
          fullname: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[0]['fullname'] if data and data | length > 0 else 'N/A' }}
          fmsstatus: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[0]['fmsstatus'] if data and data | length > 0 else 0 }}
          fmsstatus_note: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[0]['fmsstatus_note'] if data and data | length > 0 else '' }}

      # --- Fahrzeug 2 ---
      - name: "Divera Fahrzeug 2"
        unique_id: divera_vehicle_1
        state: >-
          {% set values = ['funkfrei','auf Wache','Einsatz übernommen','Einsatzstelle an','Sprechwunsch','nicht einsatzbereit'] %}
          {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
          {% if data and data | length > 1 %}
            {% set status = data[1]['fmsstatus'] | int - 1 %}
            {{ values[status] if status in range(values | length) else 'unbekannt' }}
          {% else %}
            unbekannt
          {% endif %}
        attributes:
          shortname: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[1]['shortname'] if data and data | length > 1 else 'N/A' }}
          fullname: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[1]['fullname'] if data and data | length > 1 else 'N/A' }}
          fmsstatus: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[1]['fmsstatus'] if data and data | length > 1 else 0 }}
          fmsstatus_note: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[1]['fmsstatus_note'] if data and data | length > 1 else '' }}

      # --- Fahrzeug 3 ---
      - name: "Divera Fahrzeug 3"
        unique_id: divera_vehicle_2
        state: >-
          {% set values = ['funkfrei','auf Wache','Einsatz übernommen','Einsatzstelle an','Sprechwunsch','nicht einsatzbereit'] %}
          {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
          {% if data and data | length > 2 %}
            {% set status = data[2]['fmsstatus'] | int - 1 %}
            {{ values[status] if status in range(values | length) else 'unbekannt' }}
          {% else %}
            unbekannt
          {% endif %}
        attributes:
          shortname: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[2]['shortname'] if data and data | length > 2 else 'N/A' }}
          fullname: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[2]['fullname'] if data and data | length > 2 else 'N/A' }}
          fmsstatus: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[2]['fmsstatus'] if data and data | length > 2 else 0 }}
          fmsstatus_note: >-
            {% set data = state_attr('sensor.divera_vehicle_raw', 'data') %}
            {{ data[2]['fmsstatus_note'] if data and data | length > 2 else '' }}

      # Weitere Fahrzeuge: Kopiere einen Block, ändere den Index [3], [4], ...
```

> **Annahme:** Die Anzahl der Fahrzeuge ist feuerwehrspezifisch. Die Template-Sensoren müssen 1:1 mit den Fahrzeugen in deinem Divera-Account übereinstimmen. Prüfe die Anzahl über `https://www.divera247.com/api/v2/pull/vehicle-status?accesskey=DEIN-KEY` im Browser.

---

## Schritt 3: Dashboard Card konfigurieren

Die Card wird automatisch als Lovelace-Ressource registriert, sobald die Integration geladen ist — keine manuelle Installation oder Ressourcen-Eintrag nötig.

Füge die Card in dein Dashboard ein (YAML-Modus):

```yaml
# ============================================================
# DIVERA 24/7 Alarm Dashboard Card
# ============================================================
type: custom:divera-alarm-card

# --- Pflicht: Entity-IDs ---
# Passe diese an die Entity-Namen deiner HACS Integration an.
# Prüfe unter Entwicklerwerkzeuge → Zustände welche Entities existieren.
alarm_entity: sensor.divera_last_alarm
alarm_id_entity: sensor.divera_last_alarm_id
status_entity: sensor.divera_status

# --- Fahrzeuge: Liste der Template-Sensor Entity-IDs ---
vehicle_entities:
  - sensor.divera_fahrzeug_1
  - sensor.divera_fahrzeug_2
  - sensor.divera_fahrzeug_3

# --- Anzeige-Optionen ---
title: "DIVERA 24/7"
unit_name: "FF Musterstadt" # Name eurer Feuerwehr
show_map: true # Karte mit Einsatzort
show_vehicles: true # Fahrzeugstatus
show_status: true # Eigener Verfügbarkeitsstatus
map_zoom: 15 # Zoom-Level der Karte (10-18)
theme: dark # 'dark' oder 'light'
```

---

## Schritt 4: Automationen (optional)

### Alarm-Benachrichtigung auf dem Handy

```yaml
automation:
  - alias: "Divera Alarm Notification"
    trigger:
      - platform: state
        entity_id: sensor.divera_last_alarm
    condition:
      - condition: template
        value_template: >
          {{ trigger.to_state.state not in ['unavailable', 'unknown', 'idle', '', 'None'] }}
    action:
      - service: notify.mobile_app_dein_handy
        data:
          title: "🚒 ALARM"
          message: >
            {{ state_attr('sensor.divera_last_alarm', 'title') }}
            — {{ state_attr('sensor.divera_last_alarm', 'address') }}
          data:
            priority: high
            channel: alarm
            importance: max
```

### Licht bei Alarm einschalten

```yaml
automation:
  - alias: "Divera Alarm Light"
    trigger:
      - platform: state
        entity_id: sensor.divera_last_alarm
    condition:
      - condition: template
        value_template: >
          {{ trigger.to_state.state not in ['unavailable', 'unknown', 'idle', '', 'None']
             and not state_attr('sensor.divera_last_alarm', 'closed') }}
    action:
      - service: light.turn_on
        target:
          entity_id: light.alarm_light
        data:
          color_name: red
          brightness: 255
      - delay: "00:10:00"
      - service: light.turn_off
        target:
          entity_id: light.alarm_light
```

---

## Entity-Mapping Referenz

Da die Entity-Benennung von der Integration-Version und den Einstellungen abhängt, hier eine Übersicht zur Identifikation:

| Funktion        | Typischer Entity-Name         | Wo prüfen                                        |
| --------------- | ----------------------------- | ------------------------------------------------ |
| Letzter Alarm   | `sensor.divera_last_alarm`    | Entwicklerwerkzeuge → Zustände → "divera" suchen |
| Alarm-ID        | `sensor.divera_last_alarm_id` | ditto                                            |
| Eigener Status  | `sensor.divera_status`        | ditto                                            |
| Fahrzeug (REST) | `sensor.divera_fahrzeug_X`    | Definiert in deiner `configuration.yaml`         |

> **Wichtig:** Die Entity-Namen der HACS-Integration können je nach Version und Einheit variieren. Prüfe immer unter **Entwicklerwerkzeuge → Zustände** nach der Ersteinrichtung, welche Entities tatsächlich angelegt wurden, und passe die Card-Konfiguration entsprechend an.

---

## Fehlerbehebung

**Integration zeigt keine Entities:**
Prüfe den Access-Key unter `https://www.divera247.com/api/v2/pull/all?accesskey=DEIN-KEY` im Browser. Ist die Antwort ein gültiges JSON mit `"success": true`?

**Fahrzeug-Sensoren zeigen "unbekannt":**
Die API gibt Fahrzeuge als Array zurück. Prüfe die Indexierung — wenn du 5 Fahrzeuge hast, brauchst du Indices `[0]` bis `[4]`.

**Karte zeigt nichts:**
Die Karte benötigt `lat` und `lng` Attribute im Alarm-Entity. Diese sind erst ab der ALARM-Version von Divera verfügbar (nicht FREE).

**Update-Intervall zu langsam:**
Die HACS Integration pollt standardmäßig alle 60 Sekunden. Für schnelleres Polling kannst du eine Automation erstellen, die `homeassistant.update_entity` häufiger aufruft.

---

## Divera API Limitierungen

| Feature               | FREE          | ALARM        | PRO          |
| --------------------- | ------------- | ------------ | ------------ |
| API Request-Rate      | 1 / 5 Min     | unbegrenzt   | unbegrenzt   |
| Alarm-Daten           | nur Stichwort | alle Details | alle Details |
| Adresse / Koordinaten | ✗             | ✓            | ✓            |
| Einheitsübergreifend  | ✗             | ✗            | ✓            |
