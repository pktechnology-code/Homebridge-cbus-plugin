'use strict';

const assert = require('node:assert/strict');
const net = require('node:net');
const test = require('node:test');

const CGateClient = require('../lib/cgate-client.js');

function listen(server) {
	return new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			server.removeListener('error', reject);
			resolve(server.address().port);
		});
	});
}

function close(server) {
	return new Promise(resolve => server.close(resolve));
}

test('preserves zero-valued network and application addresses', () => {
	const client = new CGateClient('127.0.0.1', 20023, 'TEST', 0, 0, false);

	assert.equal(client.network, 0);
	assert.equal(client.application, 0);
});

test('completes the C-Gate handshake and reports ready state', async () => {
	const server = net.createServer(socket => {
		socket.write('201 Service ready: Clipsal C-Gate Version: v4.12.0 (build 1234) #cmd-syntax=1.0\r\n');
		socket.on('data', data => {
			if (String(data).includes('events e8s0c0')) {
				socket.write('[99] 200 OK.\r\n');
			}
		});
	});
	const port = await listen(server);
	const client = new CGateClient('127.0.0.1', port, 'TEST', 254, 56, false);

	await new Promise((resolve, reject) => {
		client.connect(err => err ? reject(err) : resolve());
	});

	assert.equal(client.connectionReady, true);
	assert.equal(client.everReady, true);
	client.disconnect();
	await close(server);
});

test('fails a connection that never completes the C-Gate handshake', async () => {
	const server = net.createServer(() => {});
	const port = await listen(server);
	const client = new CGateClient('127.0.0.1', port, 'TEST', 254, 56, false);
	client.connectionTimeoutMs = 25;

	const error = await new Promise(resolve => client.connect(resolve));

	assert.match(error.message, /Timed out waiting for C-Gate handshake/);
	client.disconnect();
	await close(server);
});

test('times out pending commands and removes them from the queue', async () => {
	const client = new CGateClient('127.0.0.1', 20023, 'TEST', 254, 56, false);
	client.connectionReady = true;
	client.commandTimeoutMs = 10;
	client.socket = {
		writable: true,
		write(raw, callback) {
			callback();
		}
	};

	const response = await new Promise(resolve => {
		client._sendMessage('get //TEST/254/56/0 level', resolve);
	});

	assert.match(response.error.message, /timed out/);
	assert.equal(client.pendingCommands.size, 0);
});

test('rejects commands when the pending queue limit is reached', async () => {
	const client = new CGateClient('127.0.0.1', 20023, 'TEST', 254, 56, false);
	client.connectionReady = true;
	client.maxPendingCommands = 0;
	client.socket = { writable: true };

	const response = await new Promise(resolve => {
		client._sendMessage('get //TEST/254/56/0 level', resolve);
	});

	assert.match(response.error.message, /queue limit/);
	assert.equal(client.pendingCommands.size, 0);
});

test('rejects oversized C-Gate lines and XML snippets', () => {
	const client = new CGateClient('127.0.0.1', 20023, 'TEST', 254, 56, false);
	client.maxLineLength = 3;
	client.maxSnippetLength = 3;

	let lineError;
	client.once('junk', err => {
		lineError = err;
	});
	client._socketReceivedLine('1234');
	assert.match(lineError.message, /line exceeded/);

	client._resolveSnippetFragment({
		code: 343,
		commandId: 100,
		remainder: 'Begin XML snippet'
	});
	assert.throws(() => {
		client._resolveSnippetFragment({
			code: 347,
			commandId: 100,
			remainder: '1234'
		});
	}, /snippet exceeded/);
	assert.equal(client.snippet, undefined);
});
