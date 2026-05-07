'use strict';

const fs = require('fs');
const path = require('path');
const { HomebridgePluginUiServer, RequestError } = require('@homebridge/plugin-ui-utils');

class CBusUiServer extends HomebridgePluginUiServer {
  constructor() {
    super();

    this.onRequest('/read-discovery-cache', this.readDiscoveryCache.bind(this));

    this.ready();
  }

  async readDiscoveryCache(payload) {
    const requestedPath = payload && payload.discoveryCachePath
      ? String(payload.discoveryCachePath)
      : '';

    const candidatePaths = [];

    if (requestedPath.trim() !== '') {
      candidatePaths.push(path.resolve(requestedPath));
    }

    candidatePaths.push(path.resolve(this.homebridgeStoragePath, 'cbus-discovery-cache.json'));
    candidatePaths.push(path.resolve(process.cwd(), 'cbus-discovery-cache.json'));
    candidatePaths.push('/volume1/DATA1/cbus-discovery-cache.json');

    const uniquePaths = [...new Set(candidatePaths)];

    for (const filePath of uniquePaths) {
      try {
        if (!fs.existsSync(filePath)) {
          continue;
        }

        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);

        return {
          path: filePath,
          cache: parsed
        };
      } catch (err) {
        throw new RequestError(`Failed to read discovery cache at ${filePath}: ${err.message}`, { status: 500 });
      }
    }

    throw new RequestError(`Discovery cache not found. Tried: ${uniquePaths.join(', ')}`, { status: 404 });
  }
}

(() => {
  return new CBusUiServer();
})();