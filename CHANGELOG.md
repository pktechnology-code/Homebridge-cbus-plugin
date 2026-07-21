# Changelog

## Unreleased

- Added a C-Gate settings test in the Homebridge custom UI.
- Added package validation and GitHub Actions checks.
- Restored the MIT license text used by the package metadata.

## 2.4.23

- Fixed command-timeout completion under Node's test runner by keeping pending timers active until they resolve or are cleared.
- Updated GitHub Actions validation from Node.js 20 to Node.js 24.

## 2.4.22

- Fixed C-Gate level, measurement, and security event handling.
- Preserved valid zero-valued network and application addresses throughout the plugin and custom UI.
- Added connection and command timeouts, a bounded command queue, and C-Gate line, XML snippet, and database size limits.
- Improved error propagation from C-Gate commands to HomeKit accessory callbacks.
- Corrected security zone-state handling, the security status request address, and shutter inversion behavior.
- Replaced third-party CDN styling with bundled Bootstrap CSS and its license.
- Removed the unused arbitrary cache-reader endpoint and made discovery-cache writes atomic with private file permissions.
- Added schema bounds, connection response-time diagnostics, compatible dependency updates, and broader automated tests.

## 2.4.21

- Fixed valid C-Bus accessories using group ID `0` being skipped during registration.

## 2.4.18

- Reworked the Homebridge custom UI into a guided C-Gate setup, discovery, and accessory selection workflow.
- Added direct accessory discovery from C-Gate without relying on a hard-coded discovery cache path.
- Added manual accessory entry for groups that are not discovered automatically.
- Removed hard-coded project names from the UI defaults.
