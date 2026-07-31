'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const DiscoveryCache = require('../lib/discovery-cache.js');

test('writes cache files atomically with private permissions', t => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cbus-cache-test-'));
	t.after(() => fs.rmSync(directory, { recursive: true }));

	const filePath = path.join(directory, 'cache.json');
	DiscoveryCache.writeJsonAtomically(filePath, { group: 0 });

	assert.deepEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), { group: 0 });
	if (process.platform !== 'win32') {
		assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
	}
	assert.deepEqual(fs.readdirSync(directory), ['cache.json']);
});

test('keeps an existing discovery cache when C-Gate returns no groups', t => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cbus-cache-test-'));
	t.after(() => fs.rmSync(directory, { recursive: true }));

	const filePath = path.join(directory, 'cache.json');
	const platform = {
		config: { discoveryCachePath: filePath },
		project: 'TEST',
		network: 254,
		application: 56,
		database: { groups: { '//TEST/254/56/32': { tag: 'Hallway' } } }
	};

	DiscoveryCache.writeDiscoveryCache(platform);
	assert.equal(JSON.parse(fs.readFileSync(filePath, 'utf8')).totalGroups, 1);

	platform.database = { groups: {} };
	const result = DiscoveryCache.writeDiscoveryCache(platform);

	assert.equal(result.skipped, true);
	assert.equal(JSON.parse(fs.readFileSync(filePath, 'utf8')).totalGroups, 1);
});
