'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('uses bundled UI styling instead of a third-party CDN', () => {
	const html = fs.readFileSync(path.join(root, 'homebridge-ui/public/index.html'), 'utf8');

	assert.match(html, /href="bootstrap\.min\.css"/);
	assert.doesNotMatch(html, /cdn\.jsdelivr\.net/);
	assert.equal(fs.existsSync(path.join(root, 'homebridge-ui/public/bootstrap.min.css')), true);
	assert.equal(fs.existsSync(path.join(root, 'homebridge-ui/public/bootstrap.LICENSE.txt')), true);
});

test('does not expose the removed arbitrary cache-reader endpoint', () => {
	const server = fs.readFileSync(path.join(root, 'homebridge-ui/server.js'), 'utf8');
	assert.doesNotMatch(server, /read-discovery-cache/);
});
