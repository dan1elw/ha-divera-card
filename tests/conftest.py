"""Shared fixtures for Divera integration tests."""

import pytest

MOCK_ACCESSKEY = "test-accesskey-abc123"
MOCK_UCR_ID = 123


@pytest.fixture
def mock_divera_data() -> dict:
    """Return a minimal but complete Divera API response."""
    return {
        "success": True,
        "data": {
            "user": {
                "firstname": "Max",
                "lastname": "Mustermann",
                "email": "max@example.com",
                "accesskey": MOCK_ACCESSKEY,
            },
            "ucr_default": MOCK_UCR_ID,
            "ucr_active": MOCK_UCR_ID,
            "ucr": {
                str(MOCK_UCR_ID): {
                    "name": "Test Unit",
                    "shortname": "TU",
                    "cluster_id": 456,
                    "usergroup_id": 4,
                    "new_messages": 0,
                    "new_alarms": 0,
                }
            },
            "cluster": {
                "status": {
                    "1": {"name": "Available"},
                    "2": {"name": "Unavailable"},
                },
                "statussorting": [1, 2],
                "version_id": 3,
                "group": {
                    "10": {"name": "Group Alpha"},
                },
                "vehicle": {
                    "v1": {
                        "fullname": "HLF 20",
                        "shortname": "HLF",
                        "name": "HLF 20/16",
                        "fmsstatus_id": 2,
                        "fmsstatus_note": None,
                        "fmsstatus_ts": 1700000000,
                        "lat": 48.1,
                        "lng": 11.5,
                        "opta": "FL 12/44-1",
                        "issi": None,
                        "number": "1",
                    }
                },
                "fms_status": {
                    "2": {"name": "On Route", "title": "On Route"},
                },
            },
            "status": {
                "status_id": 1,
                "status_set_date": 1700000000,
                "status_reset_date": None,
                "status_reset_id": None,
                "note": None,
                "vehicle": None,
            },
            "alarm": {
                "sorting": [99],
                "items": {
                    "99": {
                        "id": 99,
                        "foreign_id": None,
                        "title": "Test Alarm",
                        "text": "Alarm details",
                        "date": 1700000000,
                        "address": "Test Street 1",
                        "lat": 48.1,
                        "lng": 11.5,
                        "group": [10],
                        "priority": True,
                        "closed": False,
                        "new": True,
                        "ucr_self_addressed": False,
                        "ucr_answered": {},
                        "ucr_self_status_id": None,
                        "ucr_self_note": None,
                        "scene_object": None,
                        "caller": None,
                        "patient": None,
                        "remark": None,
                        "units": None,
                        "destination": None,
                        "destination_address": None,
                        "destination_lat": None,
                        "destination_lng": None,
                        "additional_text_1": None,
                        "additional_text_2": None,
                        "additional_text_3": None,
                        "report": None,
                        "vehicle": [],
                        "custom": [],
                        "ts_close": None,
                        "ts_create": 1700000000,
                        "ts_update": 1700000000,
                        "cross_unit_meta": {"groups": {}, "clusters": {}},
                        "count_recipients": 5,
                        "count_read": 3,
                    }
                },
            },
            "news": {
                "sorting": [55],
                "items": {
                    "55": {
                        "id": 55,
                        "foreign_id": None,
                        "author_id": 1,
                        "title": "Test News",
                        "text": "News body",
                        "date": 1700000000,
                        "address": None,
                        "group": [10],
                        "new": True,
                        "ucr_self_addressed": False,
                        "count_recipients": 10,
                        "count_read": 7,
                        "ts_create": 1700000000,
                        "ts_update": 1700000000,
                    }
                },
            },
            "events": {
                "sorting": [],
                "items": {},
            },
        },
    }
