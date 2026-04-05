"""Utils Module for Divera Integration."""

from yarl import URL


def remove_params_from_url(url: URL) -> str:
    """Return the URL as a string with all query parameters removed.

    Args:
        url (URL): The URL from which parameters need to be removed.

    Returns:
        str: URL without the query string.

    """
    return url.with_query(None).human_repr()
