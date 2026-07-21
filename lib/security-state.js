'use strict';

function isDetected(state) {
	const normalised = String(state || '').replace(/^zone_/, '');
	return ['unsealed', 'open', 'short'].includes(normalised);
}

function isSealed(state) {
	return String(state || '').replace(/^zone_/, '') === 'sealed';
}

module.exports = {
	isDetected,
	isSealed
};
