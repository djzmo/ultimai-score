import randomize from "randomatic";
import mkdirp from "mkdirp";
import Exporter from "./Exporter";
import MusicData from "../data/music/MusicData";
import MaidataWriter from "./simai/MaidataWriter";
import {promises, existsSync} from "fs";
import {getAppropriateConverter} from "../util/ConverterUtil";
import FileExtension from "../data/converter/FileExtension";

const {writeFile, rename} = promises;

export default class SimaiExporter extends Exporter {
    async export(data: MusicData, outputPath: string): Promise<string[]> {
        if (!outputPath.endsWith('/')) {
            outputPath += '/';
        }

        const randomId = randomize('0', 6).toString();
        const strippedTitle = data.title ? data.title.replace(/[^\w\s]/gi, '').toLowerCase() : randomId;
        const slug = strippedTitle.length ? strippedTitle : randomId;
        const musicDirectory = outputPath + slug + '/';

        if (!existsSync(musicDirectory)) {
            await mkdirp(musicDirectory);
        }

        const maidataPath = musicDirectory + 'maidata.txt';
        const maidataWriter = new MaidataWriter(data);
        const maidataOutput = maidataWriter.output;

        if (maidataOutput && maidataOutput.length > 0) {
            await writeFile(maidataPath, maidataOutput);
        }

        const output = [maidataPath];

        if (!this.ignoreSounds && this.converters) {
            if (data.trackPath) {
                const fileName = data.trackPath.indexOf('/') ? data.trackPath.substring(data.trackPath.lastIndexOf('/') + 1) : data.trackPath;
                const trackExtension = fileName.substring(fileName.lastIndexOf('.'));
                const fromExtension = <FileExtension> trackExtension;
                const toExtension = FileExtension.MP3;
                const converter = getAppropriateConverter(this.converters, fromExtension, toExtension);
                if (converter) {
                    const files = await converter.convert(data.trackPath, musicDirectory);
                    if (files.length) {
                        const newPath = files[0].substring(0, files[0].lastIndexOf('/') + 1) + 'track.mp3';
                        await rename(files[0], newPath);
                        output.push(newPath);
                    } else {
                        throw new Error(`Failed to convert ${fromExtension}->${toExtension}`);
                    }
                } else {
                    throw new Error(`No appropriate converter for ${fromExtension}->${toExtension}`);
                }
            }
        }

        return output;
    }
}
