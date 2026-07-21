'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const accessoryConfig = require('../lib/accessory-config.js');

test('accepts numeric and string group ID zero', () => {
	assert.equal(accessoryConfig.hasGroupId({ id: 0 }), true);
	assert.equal(accessoryConfig.hasGroupId({ id: '0' }), true);
	assert.equal(accessoryConfig.normaliseGroupId(0), '0');
});

test('rejects missing, null, empty, and whitespace-only group IDs', () => {
	assert.equal(accessoryConfig.hasGroupId(), false);
	assert.equal(accessoryConfig.hasGroupId({}), false);
	assert.equal(accessoryConfig.hasGroupId({ id: null }), false);
	assert.equal(accessoryConfig.hasGroupId({ id: '' }), false);
	assert.equal(accessoryConfig.hasGroupId({ id: '   ' }), false);
});

test('normalises non-empty group IDs to trimmed strings', () => {
	assert.equal(accessoryConfig.normaliseGroupId(42), '42');
	assert.equal(accessoryConfig.normaliseGroupId(' 42 '), '42');
});
