'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const SecurityState = require('../lib/security-state.js');

test('maps C-Gate security zone states consistently', () => {
	for (const state of ['unsealed', 'open', 'short', 'zone_unsealed', 'zone_open', 'zone_short']) {
		assert.equal(SecurityState.isDetected(state), true);
	}

	assert.equal(SecurityState.isDetected('sealed'), false);
	assert.equal(SecurityState.isSealed('sealed'), true);
	assert.equal(SecurityState.isSealed('zone_sealed'), true);
});
