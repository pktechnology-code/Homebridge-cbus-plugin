'use strict';

function normaliseGroupId(value) {
	if (typeof value === 'undefined' || value === null) {
		return undefined;
	}

	const normalised = String(value).trim();
	return normalised.length === 0 ? undefined : normalised;
}

function hasGroupId(config) {
	return Boolean(config) && typeof normaliseGroupId(config.id) !== 'undefined';
}

module.exports = {
	hasGroupId,
	normaliseGroupId
};
