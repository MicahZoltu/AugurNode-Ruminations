import JsonRpcDispatch from 'jsonrpc-dispatch';
import { JsonRpcMessage, JsonRpcNotification, JsonRpcRequest, JsonRpcResponse, JsonRpcError, JsonRpcDispatcher } from 'jsonrpc-dispatch';
export { JsonRpcMessage, JsonRpcNotification, JsonRpcRequest, JsonRpcResponse, JsonRpcError };

export class Dispatcher {
	private jsonRpcDispatch: JsonRpcDispatch;

	public constructor(messageDispatcher: JsonRpcDispatcher, methodRegistry: any) {
		this.jsonRpcDispatch = new JsonRpcDispatch(messageDispatcher, methodRegistry);
	}

	public handle = (message: JsonRpcMessage): void => {
		this.jsonRpcDispatch.handle(message);
	}
}
