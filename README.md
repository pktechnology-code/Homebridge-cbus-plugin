![npm](https://img.shields.io/npm/v/homebridge-cbus-v2)
![downloads](https://img.shields.io/npm/dt/homebridge-cbus-v2)
![Homebridge](https://img.shields.io/badge/Homebridge-2.x-blue)

# homebridge-cbus-v2

Homebridge 2.x compatible C-Bus / Clipsal C-Gate platform plugin.

This plugin connects Homebridge to a Clipsal C-Bus installation through C-Gate, discovers C-Bus groups, and lets you choose which groups should appear in HomeKit.

## Requirements

- Homebridge 2.x
- Node.js 18 or newer
- A running C-Gate server
- The C-Gate project name from Toolkit/C-Gate

## Install from GitHub

```bash
npm install github:pktechnology-code/homebridge-cbus-plugin
```

Or install/update it through the Homebridge UI if you are using this repository as the plugin source.

## Basic Configuration

The platform alias is `CBus`.

Example:

```json
{
  "platform": "CBus",
  "name": "Clipsal C-Gate",
  "client_ip_address": "127.0.0.1",
  "client_controlport": 20023,
  "client_cbusname": "MYHOUSE",
  "client_network": 254,
  "client_application": 56,
  "discoveryCacheEnabled": true,
  "discoveredAccessories": []
}
```

Replace `MYHOUSE` with your actual C-Gate project name. Project names are usually uppercase and are limited by C-Gate naming rules.

## Homebridge UI Workflow

Open the plugin settings in Homebridge. The custom UI is designed to work in this order:

1. Enter the C-Gate connection settings.
2. Click **Apply Settings**.
3. Click **Discover Accessories**.
4. Tick the accessories you want exposed to HomeKit.
5. Optionally add accessories manually if they were not discovered.
6. Click **Save Selected Accessories**.
7. Click the purple Homebridge **Save** button.
8. Restart Homebridge.

Important: **Apply Settings** and **Save Selected Accessories** prepare the plugin configuration inside the Homebridge UI. The purple Homebridge **Save** button is still the final step that writes the changes to `config.json`.

## Discovery Cache

Discovery reads the C-Gate database and creates a JSON cache of C-Bus groups.

If **Discovery Cache Output Path** is blank, the cache is written to the Homebridge storage folder:

```text
cbus-discovery-cache.json
```

On many systems this will look like:

```text
/volume1/homebridge/cbus-discovery-cache.json
```

You can set a custom cache path in **Advanced** if needed.

The cache is useful for reviewing all C-Bus groups and names before selecting accessories.

## Manual Accessories

If an accessory is not found during discovery, use the manual entry row in the UI.

Manual entries need:

- ID: the C-Bus group address
- Name: the HomeKit accessory name
- Type: light, dimmer, switch, fan, motion, security, shutter, trigger, smoke, contact, or temperature
- Active Duration: optional, for momentary actions such as garage doors or triggers

After adding a manual accessory, click **Save Selected Accessories**, then the purple Homebridge **Save** button.

## Accessory Types

Supported accessory types include:

- `light`
- `dimmer`
- `switch`
- `fan`
- `motion`
- `security`
- `shutter`
- `trigger`
- `smoke`
- `contact`
- `temperature`

## Advanced Options

Most users can leave the Advanced section alone.

### Discovery Cache Output Path

Optional full path for the discovery cache JSON file. Leave blank to use the Homebridge storage folder.

### Platform Export Path

Optional developer/helper export. It writes a generated Homebridge platform configuration scaffold based on the C-Gate database and current plugin configuration.

Most users do not need this.

### Database Export Path

Optional developer/debug export. It writes the parsed C-Gate database, including applications, groups, units, and unrecognised unit types.

Most users do not need this.

### Enable C-Gate Debug Logging

Turns on verbose C-Gate client logging for troubleshooting.

## Troubleshooting

### Discovery does not find anything

Check:

- C-Gate is running.
- `client_ip_address` points to the C-Gate host.
- `client_controlport` is usually `20023`.
- `client_cbusname` exactly matches the C-Gate project name.
- `client_network` and `client_application` match your installation.

### Avahi error in Homebridge logs

You may see:

```text
Failed to create listener for avahi-daemon server state
Error message: Error: No such interface found
```

This is not a C-Bus plugin error. It comes from Homebridge/mDNS networking. Homebridge may still run, but HomeKit network discovery can be unreliable until Avahi/mDNS and the host network interface are configured correctly.

### Changes do not appear in HomeKit

After selecting or manually adding accessories:

1. Click **Save Selected Accessories**.
2. Click the purple Homebridge **Save** button.
3. Restart Homebridge.

## Development

Run the syntax checks:

```bash
npm test
```

## Status

This is a Homebridge 2.x compatible maintenance fork of the original `homebridge-cbus` plugin. Further testing across different C-Bus installations and accessory types is recommended.
