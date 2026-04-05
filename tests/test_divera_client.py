"""Tests for DiveraClient."""

from http import HTTPStatus
from unittest.mock import AsyncMock, MagicMock

import pytest
from aiohttp import ClientError, ClientResponseError

from custom_components.divera.const import DIVERA_BASE_URL
from custom_components.divera.divera import (
    DiveraAuthError,
    DiveraClient,
    DiveraConnectionError,
)

from .conftest import MOCK_ACCESSKEY, MOCK_UCR_ID


@pytest.fixture
def mock_session() -> MagicMock:
    """Return a mock aiohttp ClientSession."""
    session = MagicMock()
    session.get = MagicMock()
    session.post = MagicMock()
    return session


@pytest.fixture
def client(mock_session: MagicMock) -> DiveraClient:
    """Return a DiveraClient backed by a mock session."""
    return DiveraClient(
        mock_session,
        accesskey=MOCK_ACCESSKEY,
        base_url=DIVERA_BASE_URL,
        ucr_id=MOCK_UCR_ID,
    )


def _stub_get(session: MagicMock, data: dict) -> None:
    """Wire session.get() to return *data* as a successful JSON response."""
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = AsyncMock(return_value=data)
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=mock_response)
    cm.__aexit__ = AsyncMock(return_value=False)
    session.get.return_value = cm


def _stub_get_error(session: MagicMock, status: int) -> None:
    """Wire session.get() to raise a ClientResponseError with *status*."""
    request_info = MagicMock()
    request_info.url = MagicMock()
    request_info.url.human_repr.return_value = "https://app.divera247.com/api/v2/pull/all"
    exc = ClientResponseError(
        request_info=request_info,
        history=(),
        status=status,
    )
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock(side_effect=exc)
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=mock_response)
    cm.__aexit__ = AsyncMock(return_value=False)
    session.get.return_value = cm


class TestPullData:
    """Tests for the pull_data HTTP layer."""

    async def test_success_populates_data(
        self, client: DiveraClient, mock_session: MagicMock, mock_divera_data: dict
    ) -> None:
        """pull_data succeeds and data is accessible via getters."""
        _stub_get(mock_session, mock_divera_data)
        await client.pull_data()
        assert client.get_full_name() == "Max Mustermann"

    async def test_unauthorized_raises_auth_error(
        self, client: DiveraClient, mock_session: MagicMock
    ) -> None:
        """HTTP 401 is converted to DiveraAuthError."""
        _stub_get_error(mock_session, HTTPStatus.UNAUTHORIZED)
        with pytest.raises(DiveraAuthError):
            await client.pull_data()

    async def test_server_error_raises_connection_error(
        self, client: DiveraClient, mock_session: MagicMock
    ) -> None:
        """Non-401 HTTP errors are converted to DiveraConnectionError."""
        _stub_get_error(mock_session, HTTPStatus.INTERNAL_SERVER_ERROR)
        with pytest.raises(DiveraConnectionError):
            await client.pull_data()


class TestDataAccessors:
    """Tests for data-parsing methods (require pull_data to have run first)."""

    @pytest.fixture(autouse=True)
    async def _populate(
        self, client: DiveraClient, mock_session: MagicMock, mock_divera_data: dict
    ) -> None:
        _stub_get(mock_session, mock_divera_data)
        await client.pull_data()

    def test_get_full_name(self, client: DiveraClient) -> None:
        assert client.get_full_name() == "Max Mustermann"

    def test_get_email(self, client: DiveraClient) -> None:
        assert client.get_email() == "max@example.com"

    def test_get_user(self, client: DiveraClient) -> None:
        user = client.get_user()
        assert user["firstname"] == "Max"
        assert user["lastname"] == "Mustermann"
        assert user["fullname"] == "Max Mustermann"
        assert user["email"] == "max@example.com"

    def test_get_base_url(self, client: DiveraClient) -> None:
        assert client.get_base_url() == DIVERA_BASE_URL

    def test_get_active_ucr(self, client: DiveraClient) -> None:
        assert client.get_active_ucr() == MOCK_UCR_ID

    def test_get_default_ucr(self, client: DiveraClient) -> None:
        assert client.get_default_ucr() == MOCK_UCR_ID

    def test_get_all_state_name(self, client: DiveraClient) -> None:
        states = client.get_all_state_name()
        assert states == ["Available", "Unavailable"]

    def test_get_state_id_by_name(self, client: DiveraClient) -> None:
        assert client.get_state_id_by_name("Available") == 1

    def test_get_state_id_by_name_not_found(self, client: DiveraClient) -> None:
        with pytest.raises(ValueError, match="not found"):
            client.get_state_id_by_name("Nonexistent")

    def test_get_user_state(self, client: DiveraClient) -> None:
        assert client.get_user_state() == "Available"

    def test_has_open_alarms_true(self, client: DiveraClient) -> None:
        assert client.has_open_alarms() is True

    def test_get_last_alarm(self, client: DiveraClient) -> None:
        assert client.get_last_alarm() == "Test Alarm"

    def test_get_last_news(self, client: DiveraClient) -> None:
        assert client.get_last_news() == "Test News"

    def test_get_last_alarm_attributes(self, client: DiveraClient) -> None:
        attrs = client.get_last_alarm_attributes()
        assert attrs["id"] == 99
        assert attrs["text"] == "Alarm details"
        assert attrs["priority"] is True
        assert attrs["closed"] is False
        assert attrs["groups"] == ["Group Alpha"]

    def test_get_last_news_attributes(self, client: DiveraClient) -> None:
        attrs = client.get_last_news_attributes()
        assert attrs["id"] == 55
        assert attrs["text"] == "News body"

    def test_get_cluster_version_pro(self, client: DiveraClient) -> None:
        assert client.get_cluster_version() == "Pro"

    def test_get_vehicle_id_list(self, client: DiveraClient) -> None:
        assert client.get_vehicle_id_list() == ["v1"]

    def test_get_vehicle_state(self, client: DiveraClient) -> None:
        assert client.get_vehicle_state("v1") == 2

    def test_get_vehicle_attributes(self, client: DiveraClient) -> None:
        attrs = client.get_vehicle_attributes("v1")
        assert attrs["fullname"] == "HLF 20"
        assert attrs["fmsstatus_name"] == "On Route"

    def test_get_group_name_by_id(self, client: DiveraClient) -> None:
        assert client.get_group_name_by_id(10) == "Group Alpha"

    def test_get_group_name_by_id_missing(self, client: DiveraClient) -> None:
        assert client.get_group_name_by_id(9999) is None

    def test_check_usergroup_id_valid(self, client: DiveraClient) -> None:
        assert client.check_usergroup_id() is True

    def test_get_ucr_info(self, client: DiveraClient) -> None:
        info = client.get_ucr_info(MOCK_UCR_ID)
        assert info["name"] == "Test Unit"
        assert info["shortname"] == "TU"

    def test_get_fms_status_name(self, client: DiveraClient) -> None:
        assert client.get_fms_status_name(2) == "On Route"

    def test_get_fms_status_name_missing(self, client: DiveraClient) -> None:
        assert client.get_fms_status_name(999) is None

    def test_no_events_returns_none(self, client: DiveraClient) -> None:
        assert client.get_last_event() is None
