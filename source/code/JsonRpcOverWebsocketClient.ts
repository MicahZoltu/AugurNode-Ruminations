import * as Websocket from 'ws';

interface JsonRpcRequest {}
interface JsonRpcResponse {}

export class JsonRpcOverWebsocketClient {
	private websocket: Websocket;

	public constructor(address: string) {
		this.websocket = new Websocket(address);
	}

	public open = async (): Promise<void> => {
		return new Promise<void>((resolve, reject) => {
			const openHandler = (event: { target: Websocket }) => {
				this.websocket.removeListener('open', openHandler);
				this.websocket.removeListener('error', errorHandler);
				this.websocket.removeListener('close', closeHandler);
				resolve();
			}
			const errorHandler = (error?: Error) => {
				this.websocket.removeListener('open', openHandler);
				this.websocket.removeListener('error', errorHandler);
				this.websocket.removeListener('close', closeHandler);
				reject(error);
			}
			const closeHandler = (event: { wasClean: boolean, code: number, reason: string, target: Websocket }) => {
				this.websocket.removeListener('open', openHandler);
				this.websocket.removeListener('error', errorHandler);
				this.websocket.removeListener('close', closeHandler);
				reject(new Error(event.reason));
			}
			this.websocket.addEventListener('open', openHandler);
			this.websocket.addEventListener('error', errorHandler);
			this.websocket.addEventListener('close', closeHandler);
		});
	}

	public send = async (request: JsonRpcRequest): Promise<JsonRpcResponse> => {
		return new Promise<JsonRpcResponse>((resolve, reject) => {
			// TODO: send over the underlying websocket
			// TODO: hookup promise callback for when a response with the proper ID comes back
			// TODO: hookup timeout that will clear the pending callback if the request takes too long
		});
	}
}
