import MaidataWriter from "../../../src/exporter/simai/MaidataWriter";
import MusicData from "../../../src/data/music/MusicData";
import MusicNotesDifficulty from "../../../src/data/music/MusicNotesDifficulty";
import MusicNotesData from "../../../src/data/music/MusicNotesData";
import Note from "../../../src/data/music/object/Note";
import Bpm from "../../../src/data/music/object/Bpm";
import TimeSignature from "../../../src/data/music/object/TimeSignature";
import NoteType from "../../../src/data/music/object/NoteType";
import TouchArea from "../../../src/data/music/object/TouchArea";
import HoldNote from "../../../src/data/music/object/HoldNote";

const DEFAULT_MEASURE_RESOLUTION = 384;

describe('maidata writer', () => {
    const testObjects = (noteObjects: Note[] = [], bpmObjects: Bpm[] = [], timeSignatureObjects: TimeSignature[]): MusicData => {
        const notesData = new Map<MusicNotesDifficulty, MusicNotesData>();
        notesData.set(MusicNotesDifficulty.BASIC, {
            noteObjects,
            bpmObjects,
            timeSignatureObjects,
            level: 0,
            measureResolution: DEFAULT_MEASURE_RESOLUTION
        });
        return {notesData};
    };

    it('should parse BPM correctly', async () => {
        const noteObjects: Note[] = [{measure: 1, grid: 0, position: 1, type: NoteType.TAP, area: TouchArea.A}];
        const bpmObjects: Bpm[] = [{measure: 1, grid: 0, bpm: 150}];
        const timeSignatureObjects: TimeSignature[] = [];
        const parser = new MaidataWriter(testObjects(noteObjects, bpmObjects, timeSignatureObjects));
        const output = parser.output.replace(/\s/g, '');
        expect(output).toContain('(150){4}1');
    });

    it('should adjust divisors correctly', async () => {
        const noteObjects: Note[] = [
            {measure: 1, grid: 0, position: 1, type: NoteType.TAP, area: TouchArea.A},
            {measure: 1, grid: 96, position: 2, type: NoteType.TAP, area: TouchArea.A},
            {measure: 1, grid: 192, position: 3, type: NoteType.TAP, area: TouchArea.A},
            {measure: 1, grid: 288, position: 4, type: NoteType.TAP, area: TouchArea.A},
            {measure: 2, grid: 0, position: 5, type: NoteType.TAP, area: TouchArea.A},
            {measure: 2, grid: 48, position: 6, type: NoteType.TAP, area: TouchArea.A},
            {measure: 2, grid: 96, position: 7, type: NoteType.TAP, area: TouchArea.A},
            {measure: 2, grid: 120, position: 8, type: NoteType.TAP, area: TouchArea.A},
            {measure: 2, grid: 144, position: 1, type: NoteType.TAP, area: TouchArea.A},
        ];
        const bpmObjects: Bpm[] = [{measure: 1, grid: 0, bpm: 150}];
        const timeSignatureObjects: TimeSignature[] = [];
        const parser = new MaidataWriter(testObjects(noteObjects, bpmObjects, timeSignatureObjects));
        const output = parser.output.replace(/\s/g, '');
        expect(output).toContain('(150){4}1,2,3,4,{8}5,6,{16}7,8,1');
    });

    it('should produce holds correctly', async () => {
        const noteObjects: HoldNote[] = [
            {measure: 1, grid: 0, position: 1, type: NoteType.HOLD, holdLength: 96, area: TouchArea.A},
            {measure: 1, grid: 96, position: 2, type: NoteType.HOLD, holdLength: 96, area: TouchArea.A},
            {measure: 1, grid: 192, position: 3, type: NoteType.HOLD, holdLength: 192, area: TouchArea.A}
        ];
        const bpmObjects: Bpm[] = [{measure: 1, grid: 0, bpm: 150}];
        const timeSignatureObjects: TimeSignature[] = [];
        const parser = new MaidataWriter(testObjects(noteObjects, bpmObjects, timeSignatureObjects));
        const output = parser.output.replace(/\s/g, '');
        expect(output).toContain('(150){4}1h[4:1],2h[4:1],3h[2:1]');
    });

    it('should produce various taps correctly', async () => {
        const noteObjects: Note[] = [
            {measure: 1, grid: 0, position: 1, type: NoteType.TAP, area: TouchArea.A},
            {measure: 1, grid: 96, position: 2, type: NoteType.BREAK, area: TouchArea.A},
            {measure: 1, grid: 192, position: 3, type: NoteType.EX_TAP, area: TouchArea.A},
            {measure: 1, grid: 288, type: NoteType.TOUCH_TAP, firework: false, area: TouchArea.C},
            {measure: 2, grid: 0, type: NoteType.TOUCH_TAP, firework: true, area: TouchArea.C},
            {measure: 2, grid: 48, position: 6, type: NoteType.STAR, area: TouchArea.A},
            {measure: 2, grid: 96, position: 7, type: NoteType.EX_STAR, area: TouchArea.A},
            {measure: 2, grid: 120, position: 8, type: NoteType.BREAK_STAR, area: TouchArea.A},
        ];
        const bpmObjects: Bpm[] = [{measure: 1, grid: 0, bpm: 150}];
        const timeSignatureObjects: TimeSignature[] = [];
        const parser = new MaidataWriter(testObjects(noteObjects, bpmObjects, timeSignatureObjects));
        const output = parser.output.replace(/\s/g, '');
        expect(output).toContain('(150){4}1,2b,3x,C,{8}Cf,6$,{16}7x$,8b$');
    });

    // TODO
});
