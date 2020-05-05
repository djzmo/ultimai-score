import Converter from "./Converter";

export default abstract class AwbConverterBase extends Converter {
    private _key?;

    abstract convert(sourceFile: string, outDir?: string): Promise<string[]>;

    get key() {
        return this._key;
    }

    set key(value) {
        this._key = value;
    }
}
