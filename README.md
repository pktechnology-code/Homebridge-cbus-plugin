![npm](https://img.shields.io/npm/v/homebridge-cbus-v2)
![downloads](https://img.shields.io/npm/dt/homebridge-cbus-v2)
![Homebridge](https://img.shields.io/badge/Homebridge-2.x-blue)

# homebridge-cbus-v2

Homebridge v2 compatible maintenance fork of `homebridge-cbus` for Clipsal C-Bus / C-Gate.

## What changed

- Removed plugin-level `process.exit()` calls that crash Homebridge v2
- Replaced legacy inheritance helpers incompatible with class-based Homebridge Accessory
- Updated plugin startup handling for Homebridge v2
- Added `config.schema.json` so Homebridge UI can render plugin configuration
- Cleaned package for sharing (removed caches, auth, backups, logs, and `node_modules`)

## Install from GitHub

```bash
npm install github:pktechnology-code/homebridge-cbus-plugin
```

Or replace the existing `homebridge-cbus` folder manually for local testing.

## Configuration

Existing configurations should continue to work:

```json
{
  "platform": "homebridge-cbus.CBus"
}
```

## Discovery Cache

The plugin can export a JSON cache of all C-Bus groups found in C-Gate.

This is useful when you want to see all available C-Bus group IDs and names before deciding which ones to expose to HomeKit.

Enable discovery cache export in the plugin settings:

```json
{
  "discoveryCacheEnabled": true
}

## Discovered Accessories Selection

Version 2.3.0 adds a GUI-editable discovered accessories list.

After generating the discovery cache, copy selected groups into `discoveredAccessories`:

```json
{
  "discoveredAccessories": [
    {
      "enabled": true,
      "id": "6",
      "name": "Fireplace",
      "type": "light"
    },
    {
      "enabled": true,
      "id": "90",
      "name": "Garage Door",
      "type": "switch",
      "activeDuration": "1 sec"
    }
  ]
}


## Status

This is a Homebridge v2 compatibility fork. It resolves startup failures seen in Homebridge v2 environments.

Further testing across different C-Bus accessory types is recommended before publishing to npm.


