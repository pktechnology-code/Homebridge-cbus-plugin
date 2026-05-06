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
npm install github:pktechnology-code/Homebridge-cbus-plugin
