import {promises as fsPromises} from "fs";
import Loader from "./Loader";
import MusicData from "../data/music/MusicData";
import SimaiMusicData from "../data/music/format/SimaiMusicData";
import MaidataParser from "./simai/MaidataParser";
import MusicNotesData from "../data/music/MusicNotesData";
import MaidataObjectsParser from "./simai/MaidataObjectsParser";

const {readFile} = fsPromises;

export default class SimaiLoader extends Loader {
    private static DEFAULT_MEASURE_RESOLUTION = 384;
    private static DEFAULT_BPM = 120;
    private static DEFAULT_LEVEL_VALUE = 0;
    static NOTES_DIFFICULTY_MAPPING = {
        2: MusicNotesDifficulty.BASIC,
        3: MusicNotesDifficulty.ADVANCED,
        4: MusicNotesDifficulty.EXPERT,
        5: MusicNotesDifficulty.MASTER,
        6: MusicNotesDifficulty.RE_MASTER
    };

    async load(path: string): Promise<MusicData> {
        const musicData = this.loadMaidata(path);
        // TODO
        return musicData;
    }

    private async loadMaidata(path: string): Promise<SimaiMusicData> {
        const rawData = await readFile(path, {encoding: 'utf8'});
        const maidata = new MaidataParser(rawData);
        const title = maidata.getString('title');
        const artist = maidata.getString('freemsg');
        const bpm = maidata.getNumber('bpm');
        const trackPath = maidata.getString('track');
        const designer = maidata.getString('designer');

        // Parse only BASIC (inote_2) up to RE_MASTER (inote_6)
        const notesData = new Map<MusicNotesDifficulty, MusicNotesData>();
        for (let i = 2; i <= 6; i++) {
            const difficulty = SimaiLoader.NOTES_DIFFICULTY_MAPPING[i];
            const rawNotesData = maidata.getString(`inote_${i}`);
            const difficultyDesigner = maidata.getString(`des_${i}`);

            let rawLevel = maidata.getString(`lv_${i}`);
            let level = SimaiLoader.DEFAULT_LEVEL_VALUE;
            if (rawLevel != null) {
                if (!isNaN(Number(rawLevel))) {
                    level = Number(rawLevel);
                } else if (rawLevel.charAt(rawLevel.length - 1) === '+' && !isNaN(Number(rawLevel.substring(0, rawLevel.length - 1)))) {
                    level = Number(rawLevel.substring(0, rawLevel.length - 1)) + 0.5;
                }
            }

            if (rawNotesData != null) {
                const parser = new MaidataObjectsParser(rawNotesData, SimaiLoader.DEFAULT_MEASURE_RESOLUTION, bpm != null ? bpm : SimaiLoader.DEFAULT_BPM);
                const noteObjects = parser.getNoteObjects();
                const bpmObjects = parser.getBpmObjects();
                const timeSignatureObjects = parser.getTimeSignatureObjects();
                notesData.set(difficulty, {
                    designer: difficultyDesigner != null ? difficultyDesigner : designer,
                    level,
                    noteObjects,
                    bpmObjects,
                    timeSignatureObjects,
                    gridsPerMeasure: SimaiLoader.DEFAULT_MEASURE_RESOLUTION
                });
            }
        }

        return {title, artist, bpm, notesData, trackPath};
    }
}
