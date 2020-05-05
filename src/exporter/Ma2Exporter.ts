import {existsSync, promises} from "fs";
import randomize from "randomatic";
import mkdirp from "mkdirp";
import Exporter from "./Exporter";
import MusicData from "../data/music/MusicData";
import ScoreWriter from "./ma2/ScoreWriter";
import MetadataWriter from "./ma2/MetadataWriter";

const {writeFile} = promises;

export default class Ma2Exporter extends Exporter {
    private _moviePath?;
    private _soundPath?;

    async export(data: MusicData, outputPath: string): Promise<string[]> {
        if (outputPath.endsWith('/')) {
            outputPath = outputPath.substring(0, outputPath.length - 1);
        }

        const id = `0119${randomize('0', 2).toString().padStart(2, '0')}`;
        const paths: string[] = [];
        const musicDirectory = `${outputPath}/music${id}`;

        if (!existsSync(musicDirectory)) {
            await mkdirp(musicDirectory);
        }

        const metadataPath = `${musicDirectory}/Music.xml`;
        const metadataWriter = new MetadataWriter(data, id);
        const metadataOutput = metadataWriter.output;

        if (metadataOutput && metadataOutput.length > 0) {
            await writeFile(metadataPath, metadataOutput);
            paths.push(metadataPath);
        }

        for (const difficulty of Array.from(data.notesData.keys())) {
            const notesData = data.notesData.get(difficulty);
            if (notesData) {
                const ma2Difficulty = difficulty - 2;
                const path = `${musicDirectory}/${id}_0${ma2Difficulty}.ma2`;
                const writer = new ScoreWriter(notesData, data.bpm ? data.bpm : 120);
                const scoreOutput = writer.output;
                if (scoreOutput && scoreOutput.length > 0) {
                    await writeFile(path, scoreOutput);
                    paths.push(path);
                }
            }
        }

        // TODO: export sound and movie files

        return paths;
    }

    get moviePath() {
        return this._moviePath;
    }

    set moviePath(value) {
        this._moviePath = value;
    }

    get soundPath() {
        return this._soundPath;
    }

    set soundPath(value) {
        this._soundPath = value;
    }
}
