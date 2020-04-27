import {promises as fsPromises} from 'fs';
import isNumber from 'is-number';
import Importer from "./Importer";
import MusicData from "../data/music/MusicData";
import SimaiMusicData from "../data/music/format/SimaiMusicData";
import Maidata from "./simai/Maidata";
import MusicNotesData from "../data/music/MusicNotesData";
import ObjectsParser from "./simai/ObjectsParser";
import MusicNotesDifficulty from "../data/music/MusicNotesDifficulty";

const {readFile} = fsPromises;

export default class SimaiImporter extends Importer {
    private static DEFAULT_MEASURE_RESOLUTION = 384;
    private static DEFAULT_BPM = 120;
    private static DEFAULT_LEVEL_VALUE = 0;

    async analyze(path: string): Promise<boolean> {
        const valid = path.endsWith('/maidata.txt');
        if (!valid) {
            throw new Error(`Input file does not seem to be a valid maidata.txt: ${path}`);
        }
        return valid;
    }

    async import(path: string): Promise<MusicData> {
        return this.loadMaidata(path);
    }

    private async loadMaidata(path: string): Promise<SimaiMusicData> {
        const rawData = await readFile(path, {encoding: 'utf8'});
        const maidata = new Maidata(rawData);
        const title = maidata.getString('title');
        const artist = this.extractArtist(maidata);
        const bpm = maidata.getNumber('bpm');
        const trackPath = maidata.getString('track');
        const notesData = new Map<MusicNotesDifficulty, MusicNotesData>();
        const objectsParser = new ObjectsParser;
        for (let i = 1; i <= 7; i++) {
            const rawNotesData = maidata.getString(`inote_${i}`);
            const designer = this.extractDesigner(maidata, i);
            const level = this.extractLevel(maidata, i, SimaiImporter.DEFAULT_LEVEL_VALUE);
            if (rawNotesData && rawNotesData.length > 0) {
                const result = await objectsParser.parse(rawNotesData, SimaiImporter.DEFAULT_MEASURE_RESOLUTION, bpm ? bpm : SimaiImporter.DEFAULT_BPM);
                const {noteObjects, bpmObjects, timeSignatureObjects, statistics} = result;
                notesData.set(i, {
                    designer,
                    level,
                    noteObjects,
                    bpmObjects,
                    timeSignatureObjects,
                    measureResolution: SimaiImporter.DEFAULT_MEASURE_RESOLUTION,
                    statistics
                });
            }
        }

        return {title, artist, bpm, notesData, trackPath};
    }

    private extractLevel(parser: Maidata, i: number, defaultLevel?: number) {
        const level = parser.getString(`lv_${i}`);
        if (level) {
            if (isNumber(level)) {
                return Number(level);
            } else if (level.charAt(level.length - 1) === '+' && isNumber(level.substring(0, level.length - 1))) {
                return Number(level.substring(0, level.length - 1)) + 0.5;
            }
        }
        return defaultLevel ? defaultLevel : 0;
    }

    private extractDesigner(parser: Maidata, i: number) {
        const defaultDesigner = parser.getString('des');
        const designer = parser.getString(`des_${i}`);
        return designer ? designer : defaultDesigner;
    }

    private extractArtist(parser: Maidata) {
        const artist = parser.getString('artist');
        const smsg = parser.getString('smsg');
        const freemsg = parser.getString(`freemsg`);
        return artist ? artist : (smsg ? smsg : freemsg);
    }
}
