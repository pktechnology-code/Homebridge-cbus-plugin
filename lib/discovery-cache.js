'use strict';

const fs = require('fs');
const path = require('path');

const CBusNetId = require('./cbus-netid.js');

function normaliseGroupId(value) {
	if (typeof value === 'undefined' || value === null) {
		return undefined;
	}

	return String(value);
}

function suggestType(group) {
	const inferred = String(group && group.inferredType ? group.inferredType : '').toLowerCase();

	if (inferred.includes('dimmer')) return 'dimmer';
	if (inferred.includes('fan')) return 'fan';
	if (inferred.includes('shutter') || inferred.includes('blind') || inferred.includes('curtain')) return 'shutter';
	if (inferred.includes('motion')) return 'motion';
	if (inferred.includes('smoke')) return 'smoke';
	if (inferred.includes('contact')) return 'contact';
	if (inferred.includes('temperature')) return 'temperature';
	if (inferred.includes('trigger')) return 'trigger';
	if (inferred.includes('relay') || inferred.includes('light') || inferred.includes('lighting')) return 'light';

	return 'light';
}

function resolveExportPath(platform) {
	const config = platform.config || {};
	const configuredPath = config.discoveryCachePath || config.discovery_export;

	if (configuredPath && String(configuredPath).trim() !== '') {
		return path.resolve(String(configuredPath));
	}

	const storagePath = config.storagePath || process.cwd();

	return path.resolve(storagePath, 'cbus-discovery-cache.json');
}

function buildDiscoveryCache(platform) {
	if (!platform.database || !platform.database.groups) {
		throw new Error('C-Gate database groups are not available');
	}

	const includeNetwork = typeof platform.network === 'undefined' ? undefined : Number(platform.network);
	const includeApplication = typeof platform.application === 'undefined' ? undefined : Number(platform.application);

	const groups = Object.keys(platform.database.groups)
		.map(netIdString => {
			const group = platform.database.groups[netIdString];

			let parsed;
			try {
				parsed = CBusNetId.parse(netIdString);
			} catch (err) {
				return undefined;
			}

			if (typeof includeNetwork !== 'undefined' && parsed.network !== includeNetwork) {
				return undefined;
			}

			if (typeof includeApplication !== 'undefined' && parsed.application !== includeApplication) {
				return undefined;
			}

			const id = normaliseGroupId(parsed.group);

			return {
				id: id,
				netId: netIdString,
				name: group && group.tag ? group.tag : `C-Bus Group ${id}`,
				network: parsed.network,
				application: parsed.application,
				inferredType: group && group.inferredType ? group.inferredType : undefined,
				suggestedType: suggestType(group),
				controls: Array.isArray(group && group.controls) ? group.controls : []
			};
		})
		.filter(Boolean)
		.sort((a, b) => Number(a.id) - Number(b.id));

	return {
		generatedAt: new Date().toISOString(),
		project: platform.project,
		network: includeNetwork,
		application: includeApplication,
		totalGroups: groups.length,
		groups: groups
	};
}

function writeDiscoveryCache(platform) {
	const exportPath = resolveExportPath(platform);
	const cache = buildDiscoveryCache(platform);

	fs.mkdirSync(path.dirname(exportPath), { recursive: true });
	fs.writeFileSync(exportPath, JSON.stringify(cache, null, 2));

	return {
		path: exportPath,
		totalGroups: cache.totalGroups
	};
}

module.exports = {
	buildDiscoveryCache,
	writeDiscoveryCache,
	suggestType
};