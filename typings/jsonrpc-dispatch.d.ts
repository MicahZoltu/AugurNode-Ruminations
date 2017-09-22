declare module 'jsonrpc-dispatch' {
	export interface JsonRpcNotification{
		jsonrpc: '2.0';
		method: string;
		params: any[];
	}

	export interface JsonRpcRequest extends JsonRpcNotification {
		id: string|number|null;
	}

	export interface JsonRpcResponse {
		jsonrpc: '2.0';
		result: any;
	}

	export interface JsonRpcError {
		jsonrpc: '2.0';
		error: {
			code: number;
			message: string;
			data?: any
		};
	}

	export type JsonRpcMessage = JsonRpcNotification|JsonRpcRequest|JsonRpcResponse|JsonRpcError;

	export type JsonRpcDispatcher = (message: JsonRpcMessage) => void;

	class JsonRpcDispatch {
		constructor(dispatcher: JsonRpcDispatcher, methods: any);
		handle(message: JsonRpcMessage): Promise<void>;
	}

	export default JsonRpcDispatch;
}
