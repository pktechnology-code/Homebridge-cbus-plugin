'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function readText(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
	return JSON.parse(readText(relativePath));
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function walk(dir, matcher, results = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			walk(fullPath, matcher, results);
		} else if (matcher(fullPath)) {
			results.push(fullPath);
		}
	}

	return results;
}

function checkJavaScriptSyntax() {
	const roots = [
		'accessories',
		'homebridge-ui',
		'lib',
		'resources',
		'scripts'
	];

	const files = [
		path.join(root, 'index.js'),
		path.join(root, 'hot-debug.js')
	];

	for (const relativeRoot of roots) {
		files.push(...walk(
			path.join(root, relativeRoot),
			file => file.endsWith('.js')
		));
	}

	for (const file of files) {
		execFileSync(process.execPath, ['-c', file], { stdio: 'pipe' });
	}
}

function checkCustomUiScript() {
	const html = readText('homebridge-ui/public/index.html');
	const match = html.match(/<script>([\s\S]*)<\/script>/);

	assert(match, 'homebridge-ui/public/index.html must contain an inline script.');

	new Function(match[1]);
}

function checkReleaseFiles() {
	const packageJson = readJson('package.json');
	const packageLock = readJson('package-lock.json');
	const readme = readText('README.md').trim();
	const license = readText('LICENSE').trim();
	const changelog = readText('CHANGELOG.md').trim();

	assert(packageJson.license === 'MIT', 'package.json license must be MIT.');
	assert(license.includes('MIT License'), 'LICENSE must contain the MIT license text.');
	assert(readme.includes('# homebridge-cbus-v2'), 'README.md must describe the package.');
	assert(changelog.includes('# Changelog'), 'CHANGELOG.md must describe release changes.');
	assert(
		packageLock.packages
			&& packageLock.packages['']
			&& packageLock.packages[''].version === packageJson.version,
		'package-lock.json root version must match package.json.'
	);
}

checkReleaseFiles();
readJson('config.schema.json');
checkJavaScriptSyntax();
checkCustomUiScript();

console.log('Package validation passed.');
