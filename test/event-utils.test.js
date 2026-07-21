'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const EventUtils = require('../lib/event-utils.js');

test('accepts C-Gate level and application events for accessories', () => {
	assert.equal(EventUtils.isSupportedAccessoryEvent({ code: 730 }), true);
	assert.equal(EventUtils.isSupportedAccessoryEvent({ code: 702 }), true);
	assert.equal(EventUtils.isSupportedAccessoryEvent({ code: 700 }), false);
});

test('suppresses level-style logging only for measurement events', () => {
	assert.equal(EventUtils.shouldLogLevelEvent({ application: 'measurement' }), false);
	assert.equal(EventUtils.shouldLogLevelEvent({ application: 'security' }), true);
	assert.equal(EventUtils.shouldLogLevelEvent({}), true);
});
