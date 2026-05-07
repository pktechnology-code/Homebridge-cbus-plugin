'use strict';

require('./hot-debug.js');
const log = require('debug')('cbus:platform');
const logLevel = require('debug')('cbus:level');
const logClient = require('debug')('cbus:client');

const chalk = require('chalk');

const CGateClient = require(`./lib/cgate-client.js`);
const CGateDatabase = require(`./lib/cgate-database.js`);
const CGateExport = require(`./lib/cgate-export.js`);

const CBusNetId = require(`./lib/cbus-netid.js`);
const cbusUtils = require(`./lib/cbus-utils.js`);

// ==========================================================================================
// Exports block
// ==========================================================================================

module.exports = function (homebridge) {
	const Service = homebridge.hap.Service;
	const Characteristic = homebridge.hap.Characteristic;
	const Accessory = homebridge.hap.Accessory;
	const uuid = homebridge.hap.uuid;

	const CBusAccessory = require('./accessories/accessory.js')(Service, Characteristic, Accessory, uuid);
	const CBusLightAccessory = require('./accessories/light-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusDimmerAccessory = require('./accessories/dimmer-accessory.js')(Service, Characteristic, CBusLightAccessory, uuid);
	const CBusMotionAccessory = require('./accessories/motion-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusSecurityAccessory = require('./accessories/security-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusShutterAccessory = require('./accessories/shutter-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusFanAccessory = require('./accessories/fan-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusSwitchAccessory = require('./accessories/switch-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusTriggerAccessory = require('./accessories/trigger-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusSmokeAccessory = require('./accessories/smoke-sensor-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusContactAccessory = require('./accessories/contact-accessory.js')(Service, Characteristic, CBusAccessory, uuid);
	const CBusTemperatureAccessory = require('./accessories/temperature-accessory.js')(Service, Characteristic, CBusAccessory, uuid);

	Object.setPrototypeOf(CBusAccessory.prototype, Accessory.prototype);
	Object.setPrototypeOf(CBusLightAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusDimmerAccessory.prototype, CBusLightAccessory.prototype);
	Object.setPrototypeOf(CBusMotionAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusSecurityAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusShutterAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusFanAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusSwitchAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusTriggerAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusSmokeAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusContactAccessory.prototype, CBusAccessory.prototype);
	Object.setPrototypeOf(CBusTemperatureAccessory.prototype, CBusAccessory.prototype);

	homebridge.registerPlatform('homebridge-cbus', 'CBus', CBusPlatform, true);

	module.exports.accessoryDefinitions = {
		light: CBusLightAccessory,
		dimmer: CBusDimmerAccessory,
		motion: CBusMotionAccessory,
		security: CBusSecurityAccessory,
		shutter: CBusShutterAccessory,
		fan: CBusFanAccessory,
		switch: CBusSwitchAccessory,
		trigger: CBusTriggerAccessory,
		smoke: CBusSmokeAccessory,
		contact: CBusContactAccessory,
		temperature: CBusTemperatureAccessory,
	};
};

// ==========================================================================================
// CBusPlatform
// ==========================================================================================

function CBusPlatform(ignoredLog, config) {
	this.config = config || {};

	this.registeredAccessories = undefined;
	this.client = undefined;
	this.database = undefined;

	if (typeof this.config.client_ip_address === `undefined`) {
		throw new Error('client_ip_address is required');
	}

	this.cgateIpAddress = this.config.client_ip_address;
	this.cgateControlPort = (typeof this.config.client_controlport === `undefined`) ? undefined : this.config.client_controlport;

	try {
		this.project = CBusNetId.validatedProjectName(this.config.client_cbusname);
	} catch (err) {
		throw new Error(`illegal client_cbusname: ${this.config.client_cbusname}`);
	}

	this.network = (typeof this.config.client_network === `undefined`) ? undefined : this.config.client_network;
	this.application = (typeof this.config.client_application === `undefined`) ? undefined : this.config.client_application;

	log.enable(true);

	if (typeof this.config.client_debug !== `undefined`) {
		logClient.enable(this.config.client_debug);
	}
}

CBusPlatform.prototype._processEvent = function (message) {
	if (message.netId) {
		let output;

		const accessory = this.registeredAccessories ? this.registeredAccessories[message.netId.toString()] : undefined;

		if (!message.application === 'measurement') {
			const tag = this.database ? this.database.getTag(message.netId) : `NYI`;

			if (accessory) {
				output = `${chalk.red.bold(accessory.name)} (${accessory.type}) set to level ${message.level}%`;
			} else {
				output = `${chalk.red.bold.italic(tag)} (not-registered) set to level ${message.level}%`;
			}
		}

		if (message.sourceUnit && this.database) {
			const sourceId = new CBusNetId(this.project, this.network, `p`, message.sourceUnit);
			const source = this.database.getNetworkEntity(sourceId);

			if (typeof source === 'undefined') {
				log(`event source unit ${sourceId} not found.`);
			} else {
				output = `${output}, by ${chalk.red.bold(source.tag)} (${source.unitType})`;
			}
		}

		logLevel(output);

		if (accessory) {
			const err = (message.code !== 730 && !message.code === 702);
			accessory.processClientData(err, message);
		}
	} else if (message.code === 700) {
		log(`Heartbeat @ ${message.time}`);
	} else if (message.code === 751) {
		log(`Tag information changed.`);
	}
};

CBusPlatform.prototype.accessories = function (callback) {
	this.client = new CGateClient(
		this.cgateIpAddress,
		this.cgateControlPort,
		this.project,
		this.network,
		this.application,
		this.clientDebug
	);

	this.database = new CGateDatabase(new CBusNetId(this.project));

	this.client.on(`event`, function (message) {
		this._processEvent(message);
	}.bind(this));

	this.client.connect(function () {
		this.database.fetch(this.client, () => {
			const stats = this.database.getStats();
			log(`Successfully fetched ${stats.numApplications} applications, ${stats.numGroups} groups and ${stats.numUnits} units from C-Gate.`);

			if (this.config.platform_export) {
				new CGateExport(this.database).exportPlatform(this.config.platform_export, this);
			}

			if (this.config.database_export) {
				new CGateExport(this.database).exportDatabase(this.config.database_export);
			}

			const accessories = this._createAccessories();

			this.registeredAccessories = {};
			for (const accessory of accessories) {
				this.registeredAccessories[accessory.netId.toString()] = accessory;
			}

			log('Registering the accessories list…');
			callback(accessories);
		});
	}.bind(this));
};

CBusPlatform.prototype._createDiscoveredAccessoryConfigs = function () {
	if (!this.config.autoDiscover) {
		return [];
	}

	const includeIds = new Set((this.config.includeDiscoveredGroups || []).map(String));
	const excludeIds = new Set((this.config.excludeDiscoveredGroups || []).map(String));
	const defaultType = this.config.discoveryDefaultType || 'light';

	if (includeIds.size === 0) {
		log('Auto discovery enabled, but Include Discovered Group IDs is empty. No discovered groups will be exposed.');
		return [];
	}

	if (!this.database || typeof this.database.getNetworkEntity !== 'function') {
		log('Auto discovery skipped because C-Gate database is not available.');
		return [];
	}

	const discovered = [];

	for (const id of includeIds) {
		if (excludeIds.has(id)) {
			log(`Skipping discovered group ${id} because it is excluded.`);
			continue;
		}

		const netId = new CBusNetId(
			this.project,
			this.network,
			this.application,
			id
		);

		let entity;
		try {
			entity = this.database.getNetworkEntity(netId);
		} catch (err) {
			log(`Could not read discovered group ${id}: ${err}`);
		}

		const name = entity && entity.tag ? entity.tag : `C-Bus Group ${id}`;

		discovered.push({
			type: defaultType,
			id: String(id),
			name: name,
			enabled: true
		});

		log(`Auto-discovered selected group ${id}: ${name} (${defaultType})`);
	}

	return discovered;
};

CBusPlatform.prototype._createAccessories = function () {
	log('Loading the accessories list…');

	const accessories = [];

	const manualAccessoryConfigs = this.config.accessories || [];
	const discoveredAccessoryConfigs = this._createDiscoveredAccessoryConfigs();
	const combinedAccessoryConfigs = manualAccessoryConfigs.concat(discoveredAccessoryConfigs);

	for (let config of combinedAccessoryConfigs) {
		if (!config || !config.type || !config.id || !config.name) {
			log(`Skipping invalid accessory config: ${JSON.stringify(config)}`);
			continue;
		}

		if (config.enabled === false) {
			log(`Skipping disabled accessory '${config.name}' (${config.type})`);
			continue;
		}

		try {
			const accessory = this.createAccessory(config);
			accessories.push(accessory);
		} catch (err) {
			log(`Failed to create accessory '${config.name}' (${config.type}): ${err}`);
			continue;
		}
	}

	return accessories;
};

CBusPlatform.prototype.createAccessory = function (config) {
	console.assert(typeof config.type === `string`, `accessory missing type property`);

	const constructor = module.exports.accessoryDefinitions[config.type];
	if (!constructor) {
		throw new Error(`unknown accessory type '${config.type}'`);
	}

	return new constructor(this, config);
};