import { Server, JsonRpcRequest } from '../code/Server';
import { AugurNodeApi } from '../code/AugurNodeApi';
import { expect } from 'chai';
import * as WebSocket from 'ws';

describe('describe', async () => {
	let server: Server;
	beforeEach(async () => {
		if (server) await server.destroy();
		server = new Server(new AugurNodeApi(), 12345);
	});
	it('it', async () => {
		const websocket = new WebSocket('http://localhost:12345');
		const request: JsonRpcRequest = {
			id: 1,
			jsonrpc: '2.0',
			method: 'add',
			params: [1,2],
		};
		websocket.on('message', data)
		websocket.send(JSON.stringify(request))
	});
});
