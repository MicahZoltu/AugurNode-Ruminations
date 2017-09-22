export class ErrorWithData extends Error {
	private _data: any = null;

	constructor(message: string, data: any) {
		super(message);
		this._data = data;
	}

	public data = () => {
		return this._data;
	}
}
