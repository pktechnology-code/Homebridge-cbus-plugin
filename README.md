# homebridge-cbus-v2

Homebridge v2 compatible maintenance fork of `homebridge-cbus` for Clipsal C-Bus / C-Gate.

## What changed

- Removed plugin-level `process.exit()` calls that crash Homebridge v2.
- Replaced legacy inheritance helper calls that break with class-based Homebridge Accessory.
- Added package metadata for Homebridge v2.
- Added `config.schema.json` so Homebridge UI can render plugin configuration.
- Cleaned package for sharing by excluding Homebridge caches, auth, backups, logs, and installed `node_modules`.

## Install from local ZIP / folder

Copy this plugin folder to the Homebridge machine and install it from the folder:

```bash
cd /volume1/homebridge
npm install /path/to/homebridge-cbus-v2
```

Or replace the existing `homebridge-cbus` folder manually for local testing.

## Existing config

Existing platform configs should continue to use:

```json
"platform": "homebridge-cbus.CBus"
```

If installing this as the renamed package `homebridge-cbus-v2`, use:

```json
"platform": "CBus"
```

## Status

This is a v2 compatibility/modernization fork. It has been tested against the reported Homebridge v2 startup failures, but should be tested against multiple C-Bus accessory types before public npm release.
