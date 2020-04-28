import slugify from "slugify";
import randomize from "randomatic";
import mkdirp from "mkdirp";
import Exporter from "./Exporter";
import MusicData from "../data/music/MusicData";
import MaidataWriter from "./simai/MaidataWriter";
import {promises, existsSync} from "fs";

const {writeFile} = promises;

export default class SimaiExporter extends Exporter {
    async export(data: MusicData, outputPath: string): Promise<string[]> {
        outputPath = outputPath.replace(/\\/g, '/');
        if (outputPath.endsWith('/')) {
            outputPath = outputPath.substring(0, outputPath.length - 1);
        }

        const randomId = randomize('0', 6).toString();
        const strippedTitle = data.title ? data.title.replace(/[^\w\s]/gi, '').toLowerCase() : randomId;
        const slug = strippedTitle.length ? strippedTitle : randomId;
        const musicDirectory = `${outputPath}/${slug}`;

        if (!existsSync(musicDirectory)) {
            await mkdirp(musicDirectory);
        }

        const maidataPath = `${musicDirectory}/maidata.txt`;
        const maidataWriter = new MaidataWriter(data);
        const maidataOutput = maidataWriter.output;

        if (maidataOutput && maidataOutput.length > 0) {
            await writeFile(maidataPath, maidataOutput);
        }

        return [maidataPath];
    }
}
