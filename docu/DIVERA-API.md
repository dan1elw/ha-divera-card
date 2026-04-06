# DIVERA 24/7 API Reference

This document describes the DIVERA 24/7 REST API endpoints used by this integration. All information is derived from the integration source code (`divera.py`, `const.py`).

## Base URL

```
https://app.divera247.com
```

Self-hosted instances use a custom base URL configured during integration setup.

---

## Authentication

All requests require an `accesskey` query parameter. Two types of keys exist:

| Key type        | Scope                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| Personal key    | Own data only; can set own status                                         |
| System-user key | All unit data; obtained via Verwaltung → Schnittstellen → System-Benutzer |

The access key is found at: **Divera Settings → Debug → Accesskey**

---

## Endpoints

### GET `/api/v2/pull/all` — Pull all data

Fetches all data for the authenticated user in a single request. This is the primary endpoint used by the integration's polling coordinator.

**Query parameters:**

| Parameter         | Type    | Description                                                         |
| ----------------- | ------- | ------------------------------------------------------------------- |
| `accesskey`       | string  | Required. The user's access key.                                    |
| `ucr`             | integer | Optional. Filter to a specific User Cluster Relation ID.            |
| `ts_statusplan`   | integer | Unix timestamp. Returns only status changes since this time.        |
| `ts_localmonitor` | integer | Unix timestamp. Returns only local monitor changes since this time. |
| `ts_monitor`      | integer | Unix timestamp. Returns only monitor changes since this time.       |

**Example request:**

```
GET https://app.divera247.com/api/v2/pull/all
    ?accesskey=YOUR-KEY
    &ucr=12345
    &ts_statusplan=1712000000
    &ts_localmonitor=1712000000
    &ts_monitor=1712000000
```

**Response structure:**

```json
{
  "success": true,
  "data": {
    "ucr_default": 12345,
    "ucr_active": 12345,
    "user": { ... },
    "status": { ... },
    "cluster": { ... },
    "alarm": { ... },
    "news": { ... },
    "events": { ... },
    "ucr": { ... }
  }
}
```

#### `data.user`

| Field       | Type   | Description          |
| ----------- | ------ | -------------------- |
| `firstname` | string | User's first name    |
| `lastname`  | string | User's last name     |
| `email`     | string | User's email address |
| `accesskey` | string | User's access key    |

#### `data.status`

Current availability status of the authenticated user.

| Field               | Type    | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `status_id`         | integer | ID of the current status                             |
| `status_set_date`   | integer | Unix timestamp when status was set                   |
| `status_reset_date` | integer | Unix timestamp for automatic status reset, or `null` |
| `status_reset_id`   | integer | Status ID to reset to, or `null`                     |
| `note`              | string  | Optional note attached to the status                 |
| `vehicle`           | string  | Vehicle assigned to the user, or `null`              |

#### `data.cluster`

Unit (cluster) configuration including vehicles, groups, FMS statuses, and available user statuses.

| Field           | Type    | Description                                            |
| --------------- | ------- | ------------------------------------------------------ |
| `version_id`    | integer | `1` = Free, `2` = Alarm, `3` = Pro                     |
| `status`        | object  | Map of status ID → `{name: string}`                    |
| `statussorting` | array   | Ordered list of status IDs                             |
| `vehicle`       | object  | Map of vehicle ID → vehicle object (see below)         |
| `fms_status`    | object  | Map of FMS status ID → `{name: string, title: string}` |
| `group`         | object  | Map of group ID → `{name: string}`                     |

**Vehicle object** (within `data.cluster.vehicle`):

| Field            | Type    | Description                              |
| ---------------- | ------- | ---------------------------------------- |
| `fullname`       | string  | Full vehicle name                        |
| `shortname`      | string  | Short identifier (e.g. `HLF 20`)         |
| `name`           | string  | Display name                             |
| `fmsstatus_id`   | integer | Current FMS status ID (1–6)              |
| `fmsstatus_note` | string  | Optional note for the current FMS status |
| `fmsstatus_ts`   | integer | Unix timestamp of last FMS status change |
| `lat`            | float   | Last known latitude, or `null`           |
| `lng`            | float   | Last known longitude, or `null`          |
| `opta`           | string  | OPTA radio identifier                    |
| `issi`           | string  | ISSI radio identifier                    |
| `number`         | string  | Internal vehicle number                  |

**FMS status IDs:**

| ID  | Meaning             |
| --- | ------------------- |
| 1   | Frei Funk           |
| 2   | Einsatzbereit       |
| 3   | Auf Anfahrt         |
| 4   | Am Einsatzort       |
| 5   | Sprechwunsch        |
| 6   | Nicht einsatzbereit |

#### `data.alarm`

| Field     | Type   | Description                                   |
| --------- | ------ | --------------------------------------------- |
| `sorting` | array  | Ordered list of alarm IDs (most recent first) |
| `items`   | object | Map of alarm ID → alarm object (see below)    |

**Alarm object:**

| Field                 | Type    | Description                                                 |
| --------------------- | ------- | ----------------------------------------------------------- |
| `id`                  | integer | Internal alarm ID                                           |
| `foreign_id`          | string  | External/AFIS alarm ID                                      |
| `title`               | string  | Alarm keyword / incident type                               |
| `text`                | string  | Alarm message / dispatch text                               |
| `date`                | integer | Unix timestamp of the alarm                                 |
| `address`             | string  | Incident address                                            |
| `lat`                 | float   | Latitude of incident, or `null` (FREE: always `null`)       |
| `lng`                 | float   | Longitude of incident, or `null` (FREE: always `null`)      |
| `priority`            | boolean | `true` = high-priority alarm                                |
| `closed`              | boolean | `true` = incident is closed                                 |
| `new`                 | boolean | `true` = alarm is unread                                    |
| `ucr_self_addressed`  | boolean | `true` = alarm is directed at the authenticated user's unit |
| `ucr_self_status_id`  | integer | The user's response status ID, or `null`                    |
| `ucr_self_note`       | string  | The user's response note, or `null`                         |
| `ucr_answered`        | object  | Map of status ID → list of UCR IDs that responded           |
| `group`               | array   | List of group IDs alerted                                   |
| `vehicle`             | array   | List of vehicle IDs assigned                                |
| `cross_unit_meta`     | object  | Cross-unit group and cluster metadata                       |
| `scene_object`        | string  | Object type at scene                                        |
| `caller`              | string  | Caller information                                          |
| `patient`             | string  | Patient information                                         |
| `remark`              | string  | Additional remark                                           |
| `units`               | string  | Units involved                                              |
| `destination`         | string  | Destination name                                            |
| `destination_address` | string  | Destination address                                         |
| `destination_lat`     | float   | Destination latitude, or `null`                             |
| `destination_lng`     | float   | Destination longitude, or `null`                            |
| `additional_text_1-3` | string  | Configurable free-text fields                               |
| `report`              | string  | Incident report                                             |
| `count_recipients`    | integer | Number of alerted recipients                                |
| `count_read`          | integer | Number of recipients who read the alarm                     |
| `ts_close`            | integer | Unix timestamp when incident was closed, or `null`          |
| `ts_create`           | integer | Unix timestamp of alarm creation                            |
| `ts_update`           | integer | Unix timestamp of last update                               |
| `custom`              | array   | Custom fields                                               |

#### `data.news`

| Field     | Type   | Description                                  |
| --------- | ------ | -------------------------------------------- |
| `sorting` | array  | Ordered list of news IDs (most recent first) |
| `items`   | object | Map of news ID → news object (see below)     |

**News object:**

| Field                | Type    | Description                            |
| -------------------- | ------- | -------------------------------------- |
| `id`                 | integer | Internal news ID                       |
| `foreign_id`         | string  | External ID                            |
| `author_id`          | integer | User ID of the author                  |
| `title`              | string  | News title                             |
| `text`               | string  | News body                              |
| `date`               | integer | Unix timestamp                         |
| `address`            | string  | Associated address, or `null`          |
| `group`              | array   | List of group IDs the news was sent to |
| `new`                | boolean | `true` = unread                        |
| `ucr_self_addressed` | boolean | `true` = addressed to the user's unit  |
| `count_recipients`   | integer | Number of recipients                   |
| `count_read`         | integer | Number of recipients who read it       |
| `ts_create`          | integer | Unix timestamp of creation             |
| `ts_update`          | integer | Unix timestamp of last update          |

#### `data.events`

| Field     | Type   | Description                                |
| --------- | ------ | ------------------------------------------ |
| `sorting` | array  | Ordered list of event IDs                  |
| `items`   | object | Map of event ID → event object (see below) |

**Event object:**

| Field     | Type    | Description                   |
| --------- | ------- | ----------------------------- |
| `id`      | integer | Internal event ID             |
| `title`   | string  | Event title                   |
| `start`   | integer | Unix timestamp for start time |
| `end`     | integer | Unix timestamp for end time   |
| `address` | string  | Event location                |
| `text`    | string  | Event description             |

#### `data.ucr`

Map of UCR ID → UCR object. Each entry represents one unit the user belongs to.

| Field          | Type    | Description                                             |
| -------------- | ------- | ------------------------------------------------------- |
| `name`         | string  | Full unit name                                          |
| `shortname`    | string  | Short unit name                                         |
| `cluster_id`   | integer | Internal cluster ID                                     |
| `usergroup_id` | integer | User's role in the unit (`4` or `8` for standard users) |
| `new_messages` | integer | Count of unread messages                                |
| `new_alarms`   | integer | Count of unread alarms                                  |

---

### POST `/api/v2/statusgeber/set-status` — Set user status

Updates the authenticated user's availability status.

**Query parameters:**

| Parameter   | Type    | Description                      |
| ----------- | ------- | -------------------------------- |
| `accesskey` | string  | Required. The user's access key. |
| `ucr`       | integer | Required. The UCR ID to update.  |

**Request body (JSON):**

```json
{
  "Status": {
    "id": 6
  }
}
```

| Field       | Type    | Description                                       |
| ----------- | ------- | ------------------------------------------------- |
| `Status.id` | integer | The status ID to set (from `data.cluster.status`) |

**Response:** HTTP 200 on success.

---

## Divera version capabilities

The `data.cluster.version_id` field indicates which Divera tier the unit is on:

| `version_id` | Name  | Alarm coordinates | Cross-unit | API rate  |
| ------------ | ----- | ----------------- | ---------- | --------- |
| `1`          | Free  | No                | No         | 1 / 5 min |
| `2`          | Alarm | Yes               | No         | Unlimited |
| `3`          | Pro   | Yes               | Yes        | Unlimited |

> On the **Free** tier, `lat` and `lng` on alarms are always `null`. The map section of the dashboard card will show a placeholder instead.
