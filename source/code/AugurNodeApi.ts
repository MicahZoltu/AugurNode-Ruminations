export class AugurNodeApi {
	public add = (x: number, y: number): Promise<number> => {
		return Promise.resolve(x + y);
	}
}
