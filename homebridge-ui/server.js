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
			? String(payload.discoveryCachePath).trim()
			: '';

		const candidatePaths = [];

		if (requestedPath !== '') {
			candidatePaths.push(path.resolve(requestedPath));
		}

		if (this.homebridgeStoragePath) {
			candidatePaths.push(
				path.resolve(this.homebridgeStoragePath, 'cbus-discovery-cache.json')
			);
		}

		candidatePaths.push(
			path.resolve(process.cwd(), 'cbus-discovery-cache.json')
		);

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
				throw new RequestError(
					`Failed to read discovery cache at ${filePath}: ${err.message}`,
					{ status: 500 }
				);
			}
		}

		throw new RequestError(
			`Discovery cache not found. The cache is created when Homebridge starts and the C-Bus plugin successfully connects to C-Gate. Save the plugin config and restart Homebridge, or set Discovery Cache Output Path to a writable location. Tried: ${uniquePaths.join(', ')}`,
			{ status: 404 }
		);
	}
}

(() => {
	return new CBusUiServer();
})();
