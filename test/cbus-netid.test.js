'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const CBusNetId = require('../lib/cbus-netid.js');

test('accepts zero-valued network, application, and group addresses', () => {
	const id = new CBusNetId('TEST', 0, 0, 0);
	assert.equal(id.toString(), '//TEST/0/0/0');
});

test('enforces valid channel boundaries', () => {
	assert.throws(() => new CBusNetId('TEST', 254, 56, 1, 0), /channel out of range/);
	assert.throws(() => new CBusNetId('TEST', 254, 56, 1, 8), /channel out of range/);
	assert.equal(new CBusNetId('TEST', 254, 56, 1, 1).channel, 1);
	assert.equal(new CBusNetId('TEST', 254, 56, 1, 7).channel, 7);
});
