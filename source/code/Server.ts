import { AugurNodeApi } from './AugurNodeApi';
import { Dispatcher, JsonRpcMessage, JsonRpcNotification, JsonRpcRequest, JsonRpcResponse, JsonRpcError } from './Dispatcher';
import { ErrorWithData } from './ErrorWithData';
import * as WebSocket from 'ws';

export { JsonRpcNotification, JsonRpcRequest, JsonRpcResponse, JsonRpcError };

export class Server {
	private augurNodeApi: AugurNodeApi;
	private websocketServer: WebSocket.Server;
	private connections = new Set<Server.Connection>();

	public constructor(augurNodeApi: AugurNodeApi, port: number) {
		this.augurNodeApi = augurNodeApi;
		this.createConnection(port);
	}

	public destroy = async (): Promise<void> => {
		// TODO: figure out if this will close open connections as well, and whether it resolves before or after they are cleanly closed
		return new Promise<void>((resolve, reject) => {
			this.websocketServer.close(error => {
				if (error) reject(error);
				else resolve();
			});
		});
	}

	private createConnection = (port: number) => {
		this.websocketServer = new WebSocket.Server({ port: port });
		this.websocketServer.on('connection', this.onConnection);
		this.websocketServer.on('error', this.onError);
	}

	private onConnection = (websocket: WebSocket) => {
		this.connections.add(new Server.Connection(websocket, this.augurNodeApi));
	}

	private onError = (error: Error) => {
		console.log(error);
		this.createConnection(this.websocketServer.options.port!);
	}
}

export module Server {
	export enum CloseReason {
		Normal = 1000,
		GoingAway = 1001,
		ProtocolError = 1002,
		UnsupportedData = 1003,
		AbnormalClosure = 1006,
		InvalidFramePayloadData = 1007,
		PolicyViolation = 1008,
		MessageTooBig = 1009,
		MissingExtension = 1010,
		InternalError = 1011,
		ServiceRestart = 1012,
		TryAgainLater = 1013,
		BadGateway = 1014,
		TlsHandshake = 1015,
	}

	export class Connection {
		private websocket: WebSocket;
		private dispatcher: Dispatcher;

		// TODO: add error handling
		public constructor(websocket: WebSocket, augurNodeApi: AugurNodeApi) {
			this.websocket = websocket;
			this.dispatcher = new Dispatcher(this.send, augurNodeApi);
			this.websocket.on('message', this.onMessage);
			this.websocket.on('error', this.onError);
		}

		public destroy = async (code: CloseReason, message: string): Promise<void> => {
			this.websocket.close(code, message);
			// TODO: do more thorough cleanup like telling server that connection is closed and disabling callback functions
		}

		private send = (message: JsonRpcMessage): void => {
			this.websocket.send(JSON.stringify(message));
		}

		private onMessage = async (payload: WebSocket.Data) => {
			try {
				const message = this.validatePayload(this.websocket, payload);
				if (this.isRequest(message)) {
					this.dispatcher.handle(message);
				} else {
					throw new ErrorWithData('Received JSON-RPC response, error or notification but this server only supports requests.', message);
				}
			} catch (error) {
				const message = error.message ? error.message : '';
				const data = error.data ? error.data() : '';
				console.log(`Socket closed due to error while processing incoming message.\n${message}\n${data}`);
				this.destroy(CloseReason.UnsupportedData, message);
			}
		}

		private onError = (error: Error) => {
			console.log(`Socket error.\n${error}`);
			this.destroy(CloseReason.InternalError, error.message);
		}

		private validatePayload = (websocket: WebSocket, payload: WebSocket.Data): JsonRpcMessage => {
			if (typeof payload !== 'string') {
				throw new ErrorWithData('Expected string payload but recevied non-string payload.', payload);
			}

			const message = JSON.parse(payload);
			if (message.jsonrpc !== '2.0') {
				throw new ErrorWithData('Expected JSON-RPC payload but received something else.', payload);
			}

			if (this.isRequest(message)) {
				return <JsonRpcRequest>message;
			}
			else if (this.isResponse(message)) {
				return <JsonRpcResponse>message;
			}
			else if (this.isNotification(message)) {
				return <JsonRpcNotification>message;
			}
			else if (this.isError(message)) {
				return <JsonRpcError>message;
			}
			else {
				throw new ErrorWithData('Received invalid JSON-RPC payload.', payload);
			}
		}

		private isRequest = (message: any): boolean => {
			const request = <JsonRpcRequest>message;
			if (typeof request.jsonrpc !== 'string') return false;
			if (request.jsonrpc !== '2.0') return false;
			// TODO: handle `null` as a valid id (requires dealing with undefined check)
			if (typeof request.id !== 'string' && typeof request.id !== 'number') return false;
			if (typeof request.method !== 'string') return false;
			if (typeof request.params !== 'object') return false;
			if (!Array.isArray(request.params)) return false;
			return true;
		}

		private isResponse = (message: any): boolean => {
			const response = <JsonRpcResponse>message;
			if (typeof response.jsonrpc !== 'string') return false;
			if (response.jsonrpc !== '2.0') return false;
			if (typeof response.result === 'undefined') return false;
			return true;
		}

		private isNotification = (message: any): boolean => {
			const notification = <JsonRpcNotification>message;
			if (typeof notification.jsonrpc !== 'string') return false;
			if (notification.jsonrpc !== '2.0') return false;
			if (typeof notification.method !== 'string') return false;
			if (typeof notification.params === 'object') return false;
			if (!Array.isArray(notification.params)) return false;
			return true;
		}

		private isError = (message: any): boolean => {
			const error = <JsonRpcError>message;
			if (typeof error.jsonrpc !== 'string') return false;
			if (error.jsonrpc !== '2.0') return false;
			if (typeof error.error !== 'object') return false;
			if (typeof error.error.code !== 'number') return false;
			if (typeof error.error.message !== 'string') return false;
			return true;
		}
	}
}
