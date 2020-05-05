import {promises} from "fs";
import AwbConverterBase from "./AwbConverterBase";
import {getAppropriateConverter} from "../util/ConverterUtil";
import FileExtension from "../data/converter/FileExtension";

const {unlink} = promises;

export default class AwbMp3Converter extends AwbConverterBase {
    async convert(sourceFile: string, outDir?: string): Promise<string[]> {
        const acbWavConverter = getAppropriateConverter(this.converters, FileExtension.AWB, FileExtension.WAV);
        if (!acbWavConverter) {
            throw new Error(`Unable to find AWB->WAV intermediate converter`);
        }
        const wavMp3Converter = getAppropriateConverter(this.converters, FileExtension.WAV, FileExtension.MP3);
        if (!wavMp3Converter) {
            throw new Error(`Unable to find WAV->MP3 intermediate converter`);
        }
        const wavOutputs = await acbWavConverter.convert(sourceFile, outDir);
        if (!wavOutputs.length) {
            throw new Error(`Unable to convert AWB->WAV`);
        }
        const mp3Outputs = await wavMp3Converter.convert(wavOutputs[0], outDir);
        await unlink(wavOutputs[0]);
        if (!mp3Outputs.length) {
            throw new Error(`Unable to convert WAV->MP3`);
        }
        return [mp3Outputs[0]];
    }
}