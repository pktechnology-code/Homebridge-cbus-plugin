'use strict';

const { HomebridgePluginUiServer, RequestError } = require('@homebridge/plugin-ui-utils');
const CGateClient = require('../lib/cgate-client.js');
const CGateDatabase = require('../lib/cgate-database.js');
const DiscoveryCache = require('../lib/discovery-cache.js');
const CBusNetId = require('../lib/cbus-netid.js');

class CBusUiServer extends HomebridgePluginUiServer {
	constructor() {
		super();

		this.onRequest('/test-cgate-connection', this.testCgateConnection.bind(this));
		this.onRequest('/discover-accessories', this.discoverAccessories.bind(this));

		this.ready();
	}

	withTimeout(promise, timeoutMs, message) {
		let timeout;

		const timeoutPromise = new Promise((resolve, reject) => {
			timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
		});

		return Promise.race([promise, timeoutPromise])
			.finally(() => clearTimeout(timeout));
	}

	normaliseDiscoveryConfig(payload) {
		const config = payload && typeof payload === 'object' ? payload : {};
		const project = CBusNetId.validatedProjectName(String(config.client_cbusname || '').trim().toUpperCase());
		const host = String(config.client_ip_address || '127.0.0.1').trim();
		const port = Number.parseInt(config.client_controlport ?? 20023, 10);
		const network = Number.parseInt(config.client_network ?? 254, 10);
		const application = Number.parseInt(config.client_application ?? 56, 10);

		if (!host) {
			throw new Error('C-Gate Host is required.');
		}

		if (!Number.isInteger(port) || port < 1 || port > 65535) {
			throw new Error('C-Gate Control Port must be between 1 and 65535.');
		}

		if (!Number.isInteger(network) || network < 0 || network > 255) {
			throw new Error('C-Bus Network must be between 0 and 255.');
		}

		if (!Number.isInteger(application) || application < 0 || application > 255) {
			throw new Error('C-Bus Application must be between 0 and 255.');
		}

		return {
			...config,
			client_ip_address: host,
			client_controlport: port,
			client_cbusname: project,
			client_network: network,
			client_application: application
		};
	}

	connectClient(client) {
		return new Promise((resolve, reject) => {
			client.connect(err => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	}

	fetchDatabase(database, client) {
		return new Promise((resolve, reject) => {
			database.fetch(client, err => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	}

	async withCgateDatabase(payload, handler) {
		let client;

		try {
			const config = this.normaliseDiscoveryConfig(payload);

			client = new CGateClient(
				config.client_ip_address,
				config.client_controlport,
				config.client_cbusname,
				config.client_network,
				config.client_application,
				config.client_debug === true
			);

			const database = new CGateDatabase(new CBusNetId(config.client_cbusname));

			await this.withTimeout(
				this.connectClient(client),
				15000,
				`Timed out connecting to C-Gate at ${config.client_ip_address}:${config.client_controlport}.`
			);

			await this.withTimeout(
				this.fetchDatabase(database, client),
				30000,
				'Timed out fetching the C-Gate database.'
			);

			return await handler({ config, database });
		} finally {
			if (client && client.socket) {
				try {
					client.disconnect();
				} catch (err) {
					// Best-effort cleanup after C-Gate requests.
				}
			}
		}
	}

	async testCgateConnection(payload) {
		const startedAt = Date.now();
		try {
			return await this.withCgateDatabase(payload, ({ config, database }) => ({
				host: config.client_ip_address,
				port: config.client_controlport,
				project: config.client_cbusname,
				checkedAt: new Date().toISOString(),
				responseTimeMs: Date.now() - startedAt,
				stats: database.getStats()
			}));
		} catch (err) {
			throw new RequestError(
				`C-Gate test failed: ${err.message || err}`,
				{ status: 500 }
			);
		}
	}

	async discoverAccessories(payload) {
		try {
			return await this.withCgateDatabase(payload, ({ config, database }) => {
				const project = config.client_cbusname;
				const network = config.client_network;
				const application = config.client_application;

				const platform = {
					config: {
						...config,
						storagePath: this.homebridgeStoragePath || process.cwd()
					},
					database,
					project,
					network,
					application
				};

				let pathWritten;
				if (config.discoveryCacheEnabled !== false) {
					pathWritten = DiscoveryCache.writeDiscoveryCache(platform).path;
				}

				return {
					path: pathWritten,
					cache: DiscoveryCache.buildDiscoveryCache(platform)
				};
			});
		} catch (err) {
			throw new RequestError(
				`Discovery failed: ${err.message || err}`,
				{ status: 500 }
			);
		}
	}
}

(() => {
	return new CBusUiServer();
})();
