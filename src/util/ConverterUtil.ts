import FileExtension from "../data/converter/FileExtension";
import ConverterMap from "../data/converter/ConverterMap";
import Converter from "../converter/Converter";

export function getAppropriateConverter(converters: ConverterMap, from: FileExtension, to: FileExtension): Converter | undefined {
    let result;
    for (const pair of Array.from(converters.keys())) {
        if (pair.from === from && pair.to === to) {
            result = converters.get(pair);
            break;
        }
    }
    return result;
}