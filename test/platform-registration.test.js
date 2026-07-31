'use strict';

const assert = require('node:assert/strict');
const net = require('node:net');
const test = require('node:test');

const pluginInit = require('../index.js');

function createHomebridgeMock() {
	const mock = {
		hap: {
			Service: {},
			Characteristic: {},
			Accessory: function Accessory() {},
			uuid: { generate: seed => `uuid-${seed}` }
		},
		registerPlatform(pluginName, platformName, constructor) {
			mock.PlatformConstructor = constructor;
		}
	};

	return mock;
}

async function findClosedPort() {
	const probe = net.createServer(() => {});
	const port = await new Promise((resolve, reject) => {
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', () => resolve(probe.address().port));
	});
	await new Promise(resolve => probe.close(resolve));
	return port;
}

test('registers accessories from config even when C-Gate is unreachable', async () => {
	const homebridge = createHomebridgeMock();
	pluginInit(homebridge);

	const port = await findClosedPort();

	const config = {
		client_ip_address: '127.0.0.1',
		client_controlport: port,
		client_cbusname: 'TEST',
		client_network: 254,
		client_application: 56,
		accessories: [
			{ type: 'light', id: 0, name: 'Group Zero Light' },
			{ type: 'light', id: 32, name: 'Hallway' }
		]
	};

	const platform = new homebridge.PlatformConstructor(undefined, config, {
		user: { storagePath: () => process.cwd() }
	});

	// stub out HAP accessory construction; registration is what's under test
	platform.createAccessory = accessoryConfig => ({
		name: accessoryConfig.name,
		netId: { toString: () => `//TEST/254/56/${accessoryConfig.id}` }
	});

	const accessories = await new Promise(resolve => platform.accessories(resolve));

	assert.equal(accessories.length, 2);
	assert.deepEqual(accessories.map(a => a.name), ['Group Zero Light', 'Hallway']);
	assert.ok(platform.registeredAccessories['//TEST/254/56/0'], 'group 0 accessory must be registered');

	platform.client.disconnect();
});
