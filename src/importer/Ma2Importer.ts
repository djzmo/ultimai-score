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
    private _moviePath?;
    private _soundPath?;

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
        const rawData = await readFile(path, {encoding: 'utf8'});

        if (!rawData || rawData.length === 0) {
            throw new Error(`Unable to load ${path}`);
        }

        const metadataParser = new MetadataParser;
        const {id, title, artist, bpm, levels, notesDataPath, designers, genre} = await metadataParser.parse(rawData);
        const notesData: Map<MusicNotesDifficulty, MusicNotesData> = new Map<MusicNotesDifficulty, MusicNotesData>();
        const containingDirPath = path.indexOf('/') !== -1 ? path.substring(0, path.lastIndexOf('/')) + '/' : './';
        const scoreParser = new ScoreParser;
        for (const difficulty of Array.from(notesDataPath.keys())) {
            const path = containingDirPath + notesDataPath.get(difficulty);
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

        const movieContainingPath = this.moviePath ? this.moviePath :
            (path.indexOf('/') !== -1 ? path.substring(0, path.lastIndexOf('/')) : './');
        const soundContainingPath = this.soundPath ? this.soundPath :
            (path.indexOf('/') !== -1 ? path.substring(0, path.lastIndexOf('/')) : './');
        const assetId = (id >= 10000 ? Number(id.toString().substring(1)) : id).toString().padStart(6, '0');
        
        const moviePath = existsSync(`${movieContainingPath}/${assetId}.dat`) ? `${movieContainingPath}/${assetId}.dat` : undefined;
        const trackPath = existsSync(`${soundContainingPath}/music${assetId}.awb`) ? `${soundContainingPath}/music${assetId}.awb` : undefined;

        return {
            id: id.toString(),
            title,
            artist,
            bpm,
            notesData,
            genre,
            notesDataPath,
            trackPath,
            moviePath
        };
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
