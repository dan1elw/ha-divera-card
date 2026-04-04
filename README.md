# 🏠 Divera 24/7 Integration for Home Assistant

> **Note:** This is a fork of [fwmarcel/home-assistant-divera](https://github.com/fwmarcel/home-assistant-divera), which is no longer available online. Some adaptions have been made by [@dan1elw](https://github.com/dan1elw).

[![GitHub Release](https://img.shields.io/github/v/release/dan1elw/ha-divera-card?sort=semver&style=for-the-badge&color=green)](https://github.com/dan1elw/ha-divera-card/releases/)
[![GitHub Release Date](https://img.shields.io/github/release-date/dan1elw/ha-divera-card?style=for-the-badge&color=green)](https://github.com/dan1elw/ha-divera-card/releases/)
![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/dan1elw/ha-divera-card/latest/total?style=for-the-badge&label=Downloads%20latest%20Release)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/dan1elw/ha-divera-card?style=for-the-badge)
[![hacs](https://img.shields.io/badge/HACS-Integration-blue.svg?style=for-the-badge)](https://github.com/hacs/integration)

## Overview

The Divera 24/7 Home Assistant Custom Integration allows you to integrate your Divera 24/7
system with your Home Assistant setup. With this integration, you can monitor and control your Divera 24/7
devices directly from your Home Assistant dashboard, enabling seamless automation and enhanced security for your home or office.

## Installation

### HACS (recommended)

This integration is available in HACS (Home Assistant Community Store).

1. Install HACS if you don't have it already
2. Open HACS in Home Assistant
3. Go to any of the sections (integrations, frontend, automation).
4. Click on the 3 dots in the top right corner.
5. Select "Custom repositories"
6. Add following URL to the repository `https://github.com/dan1elw/ha-divera-card`.
7. Select Integration as category.
8. Click the "ADD" button
9. Search for "Divera"
10. Click the "Download" button

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=dan1elw&repository=ha-divera-card&category=Integration)

### Manual

To install this integration manually you have to download [_divera.zip_](https://github.com/dan1elw/ha-divera-card/releases/latest/download/divera.zip) and extract its contents to `config/custom_components/divera` directory:

```bash
mkdir -p custom_components/divera
cd custom_components/divera
wget https://github.com/dan1elw/ha-divera-card/releases/latest/download/divera.zip
unzip divera.zip
rm divera.zip
```

## Configuration

### Using UI

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=divera)

From the Home Assistant front page go to `Configuration` and then select `Devices & Services` from the list.
Use the `Add Integration` button in the bottom right to add a new integration called `Divera 24/7`.

A dialog appears in which your access key must be entered.
You can also change the server address if you are hosting Divera Server in your own.
In the next step, you can select the units you are a member of.

### How do you get your required access key?

1. Open the settings [website](https://app.divera247.com/account/einstellungen.html) of divera.
2. Change to the debug tab.
3. Copy your accesskey

![image](https://user-images.githubusercontent.com/59510296/177019399-29de6824-c149-4949-8421-d0edc69a7126.png)

## Usage

Once the integration is set up and configured, you can use it to monitor and manage your own availability in Home Assistant.
Access the Divera 24/7 entities from your Home Assistant dashboard to view availability status, receive alerts, and trigger actions as needed.

The entities are updated every minute by default.
If a more frequent update is required, this must be implemented using the `homeassistant.update_entity` service itself. However, I do not recommend this.

### Entities

This integration provides entities for the following information from Divera 24/7:

- the last visible alarm.
- the last news
- calendar entries
- the current status of the user.

## Automation Blueprint

You can add a basic automation blueprint here:

[![Open your Home Assistant instance and show the blueprint import dialog with a specific blueprint pre-filled.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2Fdan1elw%2Fha-divera-card%2Fblob%2Fmain%2Fdivera-blueprint.yaml)

## Help and Contribution

If you find a problem, feel free to report it and I will do my best to help you.
If you have something to contribute, your help is greatly appreciated!
If you want to add a new feature, add a pull request first so we can discuss the details.

## Disclaimer

This custom integration is not officially endorsed or supported by Divera 24/7.
The use of the Home Assistant integration for accessing the services of Divera 24/7 is at your own risk. The developer of the integration assumes no liability for any damages that may arise from its use, including but not limited to security incidents or violations of legal regulations. Depending on the configuration, sensitive personal data may be retrieved and displayed through the integration. It is the user's responsibility to ensure that this data is adequately protected.

Additionally, the user must ensure that the use of this integration complies with the requirements of the General Data Protection Regulation (GDPR). This includes, among other things, ensuring a lawful basis for processing personal data, implementing appropriate technical and organizational measures to protect the data, and preventing unauthorized access. The user is also responsible for securing their Home Assistant instance, for example, by using secure passwords, encryption, and regular updates.

## Star History

<a href="https://star-history.com/#dan1elw/ha-divera-card">
  <img src="https://api.star-history.com/svg?repos=dan1elw/ha-divera-card&type=Date" alt="Star History Chart" width="100%" />
</a>
