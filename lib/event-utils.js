'use strict';

function shouldLogLevelEvent(message) {
	return message.application !== 'measurement';
}

function isSupportedAccessoryEvent(message) {
	return message.code === 730 || message.code === 702;
}

module.exports = {
	isSupportedAccessoryEvent,
	shouldLogLevelEvent
};
