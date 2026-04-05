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
        ├── binary_sensor.*_active_alarm      → Aktiver Alarm (on/off + Alarmdetails)
        ├── sensor.*_last_alarm               → Titel des letzten Alarms
        ├── sensor.*_last_news                → Letzte Neuigkeit
        ├── sensor.*_vehicle_status_<name>    → Fahrzeugstatus (FMS) je Fahrzeug
        ├── select.*_user_status              → Eigener Verfügbarkeitsstatus
        └── calendar.*_events                 → Kalendereinträge
        │
        ▼
divera-card.js                              → Custom Lovelace Card (automatisch geladen)
```

> **Hinweis zu Entity-IDs:** Der `*`-Platzhalter in den Entity-IDs entspricht dem slugifizierten Namen deiner Einheit (z. B. `feuerwehr_musterstadt`). Die genauen Entity-IDs findest du nach der Einrichtung unter **Entwicklerwerkzeuge → Zustände**.

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

## Schritt 2: Dashboard Card konfigurieren

Die Integration erstellt automatisch Entities für Alarme, Fahrzeuge und deinen Status — keine zusätzliche Konfiguration in `configuration.yaml` nötig.

Die Card wird außerdem automatisch als Lovelace-Ressource registriert, sobald die Integration geladen ist — kein manueller Ressourcen-Eintrag nötig.

Füge die Card in dein Dashboard ein (YAML-Modus):

```yaml
# ============================================================
# DIVERA 24/7 Alarm Dashboard Card
# ============================================================
type: custom:divera-alarm-card

# --- Pflicht: Entity-IDs ---
# Passe diese an die Entity-Namen deiner Integration an.
# Prüfe unter Entwicklerwerkzeuge → Zustände welche Entities existieren.
alarm_entity: binary_sensor.feuerwehr_musterstadt_active_alarm
status_entity: select.feuerwehr_musterstadt_user_status

# --- Fahrzeuge: Liste der Fahrzeug-Entity-IDs ---
# Die Integration legt automatisch eine Entity pro Fahrzeug an.
vehicle_entities:
  - sensor.feuerwehr_musterstadt_vehicle_status_hlf20
  - sensor.feuerwehr_musterstadt_vehicle_status_tlf3000
  - sensor.feuerwehr_musterstadt_vehicle_status_rw

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

## Schritt 3: Automationen (optional)

### Alarm-Benachrichtigung auf dem Handy

```yaml
automation:
  - alias: "Divera Alarm Notification"
    trigger:
      - platform: state
        entity_id: binary_sensor.feuerwehr_musterstadt_active_alarm
        to: "on"
    action:
      - service: notify.mobile_app_dein_handy
        data:
          title: "🚒 ALARM"
          message: >
            {{ state_attr('binary_sensor.feuerwehr_musterstadt_active_alarm', 'title') }}
            — {{ state_attr('binary_sensor.feuerwehr_musterstadt_active_alarm', 'address') }}
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
        entity_id: binary_sensor.feuerwehr_musterstadt_active_alarm
        to: "on"
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

Da die Entity-Benennung vom Einheitsnamen abhängt, hier eine Übersicht zur Identifikation:

| Funktion              | Entity-Platform  | Typischer Entity-Name                              | Wo prüfen                                        |
| --------------------- | ---------------- | -------------------------------------------------- | ------------------------------------------------ |
| Aktiver Alarm         | `binary_sensor`  | `binary_sensor.*_active_alarm`                     | Entwicklerwerkzeuge → Zustände → "divera" suchen |
| Letzter Alarm (Titel) | `sensor`         | `sensor.*_last_alarm`                              | ditto                                            |
| Letzte Neuigkeit      | `sensor`         | `sensor.*_last_news`                               | ditto                                            |
| Fahrzeugstatus        | `sensor`         | `sensor.*_vehicle_status_<fahrzeugname>`           | ditto                                            |
| Eigener Status        | `select`         | `select.*_user_status`                             | ditto                                            |
| Kalender              | `calendar`       | `calendar.*_events`                                | ditto                                            |

> **Wichtig:** Ersetze `*` durch den slugifizierten Einheitsnamen. Prüfe immer unter **Entwicklerwerkzeuge → Zustände** nach der Ersteinrichtung, welche Entities tatsächlich angelegt wurden, und passe die Card-Konfiguration entsprechend an.

### Alarm-Entity Attribute

Das `binary_sensor.*_active_alarm` stellt folgende Attribute bereit (wenn ein Alarm vorhanden ist):

| Attribut              | Beschreibung                          |
| --------------------- | ------------------------------------- |
| `title`               | Alarmstichwort                        |
| `text`                | Alarmtext / Einsatzmeldung            |
| `address`             | Einsatzadresse                        |
| `latitude`            | Breitengrad des Einsatzorts           |
| `longitude`           | Längengrad des Einsatzorts            |
| `priority`            | `true` = hohe Priorität              |
| `closed`              | `true` = Einsatz abgeschlossen       |
| `date`                | Alarmierungszeitpunkt                 |
| `id`                  | Interne Alarm-ID                      |
| `groups`              | Alarmierte Gruppen                    |
| `answered`            | Eigene Rückmeldung                    |

---

## Fehlerbehebung

**Integration zeigt keine Entities:**
Prüfe den Access-Key unter `https://www.divera247.com/api/v2/pull/all?accesskey=DEIN-KEY` im Browser. Ist die Antwort ein gültiges JSON mit `"success": true`?

**Keine Fahrzeug-Entities:**
Die Integration erstellt Fahrzeug-Entities automatisch beim ersten Datenabruf. Starte Home Assistant neu und prüfe danach die Zustände.

**Karte zeigt nichts:**
Die Karte benötigt `latitude` und `longitude` Attribute im Alarm-Entity. Diese sind erst ab der ALARM-Version von Divera verfügbar (nicht FREE).

**Update-Intervall zu langsam:**
Die HACS Integration pollt standardmäßig alle 60 Sekunden. Das Intervall lässt sich in den Integrationsoptionen (Einstellungen → Geräte & Dienste → Divera 24/7 → Konfigurieren) anpassen.

---

## Divera API Limitierungen

| Feature               | FREE          | ALARM        | PRO          |
| --------------------- | ------------- | ------------ | ------------ |
| API Request-Rate      | 1 / 5 Min     | unbegrenzt   | unbegrenzt   |
| Alarm-Daten           | nur Stichwort | alle Details | alle Details |
| Adresse / Koordinaten | ✗             | ✓            | ✓            |
| Einheitsübergreifend  | ✗             | ✗            | ✓            |
