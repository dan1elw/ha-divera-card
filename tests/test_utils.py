"""Tests for the utils module."""

from yarl import URL

from custom_components.divera.utils import remove_params_from_url


def test_remove_params_from_url_strips_query() -> None:
    url = URL("https://app.divera247.com/api/v2/pull/all?accesskey=secret&ts_user=123")
    result = remove_params_from_url(url)
    assert result == "https://app.divera247.com/api/v2/pull/all"
    assert "accesskey" not in result
    assert "secret" not in result


def test_remove_params_from_url_no_params() -> None:
    url = URL("https://app.divera247.com/api/v2/pull/all")
    result = remove_params_from_url(url)
    assert result == "https://app.divera247.com/api/v2/pull/all"
