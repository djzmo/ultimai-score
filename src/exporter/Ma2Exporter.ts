import {promises, existsSync} from 'fs';
import randomize from 'randomatic';
import {create} from 'xmlbuilder2';
import mkdirp from 'mkdirp';
import Exporter from './Exporter';
import MusicData from '../data/music/MusicData';
import MusicNotesDifficulty from "../data/music/MusicNotesDifficulty";
import ScoreWriter from "./ma2/ScoreWriter";
import MetadataWriter from "./ma2/MetadataWriter";

const {writeFile} = promises;

export default class Ma2Exporter extends Exporter {
    async export(data: MusicData, outputPath: string): Promise<string[]> {
        outputPath = outputPath.replace(/\\/g, '/');
        if (outputPath.endsWith('/')) {
            outputPath = outputPath.substring(0, outputPath.length - 1);
        }

        const id = `012${randomize('0', 3)}`;
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

        return paths;
    }
}
