import {promises as fsPromises, existsSync} from "fs";
import Importer from "./Importer";
import MusicData from "../data/music/MusicData";
import Ma2MusicData from "../data/music/format/Ma2MusicData";
import MusicNotesData from "../data/music/MusicNotesData";
import MusicNotesDifficulty from "../data/music/MusicNotesDifficulty";
import ScoreParser from "./ma2/ScoreParser";
import MetadataParser from "./ma2/MetadataParser";

const {readFile} = fsPromises;

export default class Ma2Importer extends Importer {
    async analyze(path: string): Promise<boolean> {
        const valid = path.endsWith('/Music.xml');
        if (!valid) {
            throw new Error(`Input file does not seem to be a valid Music.xml: ${path}`);
        }
        return valid;
    }

    async import(path: string): Promise<MusicData> {
        return this.loadMusic(path);
    }

    private async loadMusic(path: string): Promise<Ma2MusicData> {
        path = path.replace(/\\/g, '/');
        const rawData = await readFile(path, {encoding: 'utf8'});

        if (!rawData || rawData.length === 0) {
            throw new Error(`Unable to load ${path}`);
        }

        const metadataParser = new MetadataParser;
        const {id, title, artist, bpm, levels, notesDataPath, designers, genre} = await metadataParser.parse(rawData);
        const notesData: Map<MusicNotesDifficulty, MusicNotesData> = new Map<MusicNotesDifficulty, MusicNotesData>();
        const containingDirPath = path.indexOf('/') !== -1 ? path.substring(0, path.lastIndexOf('/')) : process.cwd();
        const scoreParser = new ScoreParser;
        for (const difficulty of Array.from(notesDataPath.keys())) {
            const path = containingDirPath + '/' + notesDataPath.get(difficulty);
            if (path && existsSync(path)) {
                const level = levels.get(difficulty);
                const designer = designers.get(difficulty);
                const data = await readFile(path, {encoding: 'utf8'});
                const {noteObjects, bpmObjects, timeSignatureObjects, statistics, resolution} = await scoreParser.parse(data);
                notesData.set(difficulty, {
                    level: level ? level : 0,
                    designer,
                    noteObjects,
                    bpmObjects,
                    timeSignatureObjects,
                    statistics,
                    measureResolution: resolution
                });
                notesDataPath.set(difficulty, path);
            }
        }

        return {
            id,
            title,
            artist,
            bpm,
            notesData,
            genre,
            notesDataPath
        };
    }
}
