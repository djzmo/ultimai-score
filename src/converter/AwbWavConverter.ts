import {existsSync, promises} from "fs";
import {awb2wavs} from "node-critools";
import AwbConverterBase from "./AwbConverterBase";

const {rename} = promises;

export default class AwbWavConverter extends AwbConverterBase {
    async convert(sourceFile: string, outDir?: string): Promise<string[]> {
        outDir = this.normalizeOutDir(outDir);
        await awb2wavs(sourceFile, this.key, outDir);
        let stream = 0;
        let streamName = `${++stream}.wav`;
        const output: string[] = [];
        while (existsSync(outDir + streamName)) {
            await rename(outDir + streamName, outDir + streamName);
            output.push(outDir + streamName);
            streamName = `${++stream}.wav`;
        }
        return output;
    }
}
