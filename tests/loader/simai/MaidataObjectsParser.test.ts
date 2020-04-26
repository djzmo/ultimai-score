import MaidataObjectsParser from "../../../src/loader/simai/MaidataObjectsParser";
import TouchArea from "../../../src/data/music/object/TouchArea";
import NoteType from "../../../src/data/music/object/NoteType";
import HoldNote from "../../../src/data/music/object/HoldNote";

const MEASURE_RESOLUTION = 384;
const DEFAULT_BPM = 120;
const parse = (data, measureResolution = MEASURE_RESOLUTION, defaultBpm = DEFAULT_BPM) =>
    (new MaidataObjectsParser(data, measureResolution, defaultBpm));

describe('maidata objects parser', () => {
    it('should handle divisor correctly', () => {
        const notes = parse('{4}1,1,').getNoteObjects();
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(2);
        expect(notes[0].measure).toBe(1);
        expect(notes[1].measure).toBe(1);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(rest4);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(1);
        expect(notes[0].area).toBe(TouchArea.A);
        expect(notes[1].area).toBe(TouchArea.A);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.TAP);
    });

    it('should handle multiple divisors correctly', () => {
        const notes = parse('{1}1,{8}2,3,').getNoteObjects();
        const rest8 = MEASURE_RESOLUTION / 8;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(3);
        expect(notes[0].measure).toBe(1);
        expect(notes[1].measure).toBe(2);
        expect(notes[2].measure).toBe(2);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(0);
        expect(notes[2].grid).toBe(rest8);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(3);
        expect(notes[0].area).toBe(TouchArea.A);
        expect(notes[1].area).toBe(TouchArea.A);
        expect(notes[2].area).toBe(TouchArea.A);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.TAP);
        expect(notes[2].type).toBe(NoteType.TAP);
    });

    it('should handle BPM changes correctly', () => {
        const bpms = parse('(60){1}1,(90)2,').getBpmObjects();
        expect(bpms).toBeDefined();
        expect(bpms.length).toBe(2);
        expect(bpms[0].bpm).toBe(60);
        expect(bpms[1].bpm).toBe(90);
        expect(bpms[0].measure).toBe(1);
        expect(bpms[1].measure).toBe(2);
    });

    it('should handle break notes correctly', () => {
        const notes = parse('{4}1,2b,7,8b,').getNoteObjects();
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.BREAK);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.BREAK);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(7);
        expect(notes[3].position).toBe(8);
    });

    it('should handle EX tap notes correctly', () => {
        const notes = parse('{4}1,2x,7,8x,').getNoteObjects();
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.EX_TAP);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.EX_TAP);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(7);
        expect(notes[3].position).toBe(8);
    });

    it('should handle short hold notes correctly', () => {
        const notes = parse('{4}1,2h,7,8h,').getNoteObjects();
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.HOLD);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.HOLD);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(7);
        expect(notes[3].position).toBe(8);
        expect((<HoldNote>notes[1]).holdLength).toBeUndefined();
        expect((<HoldNote>notes[3]).holdLength).toBeUndefined();
    });

    it('should handle EX hold notes correctly', () => {
        const notes = parse('{4}1,2hx,7,8xh,').getNoteObjects();
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.EX_HOLD);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.EX_HOLD);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(7);
        expect(notes[3].position).toBe(8);
        expect((<HoldNote>notes[1]).holdLength).toBeUndefined();
        expect((<HoldNote>notes[3]).holdLength).toBeUndefined();
    });

    it('should handle forced star notes correctly', () => {
        const notes = parse('{4}1,2$,7x$,8$b,').getNoteObjects();
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.STAR);
        expect(notes[2].type).toBe(NoteType.EX_STAR);
        expect(notes[3].type).toBe(NoteType.BREAK_STAR);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(7);
        expect(notes[3].position).toBe(8);
    });

    it('should handle hold notes correctly', () => {
        const notes = parse('{4}1h[4:1],2h[4:1],{8}3hx[8:1],4xh[8:1],5b,,').getNoteObjects();
        const rest4 = MEASURE_RESOLUTION / 4;
        const rest8 = MEASURE_RESOLUTION / 8;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(5);
        expect(notes[0].type).toBe(NoteType.HOLD);
        expect(notes[1].type).toBe(NoteType.HOLD);
        expect(notes[2].type).toBe(NoteType.EX_HOLD);
        expect(notes[3].type).toBe(NoteType.EX_HOLD);
        expect(notes[4].type).toBe(NoteType.BREAK);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(3);
        expect(notes[3].position).toBe(4);
        expect(notes[4].position).toBe(5);
        expect((<HoldNote>notes[0]).holdLength).toBeDefined();
        expect((<HoldNote>notes[1]).holdLength).toBeDefined();
        expect((<HoldNote>notes[2]).holdLength).toBeDefined();
        expect((<HoldNote>notes[3]).holdLength).toBeDefined();
        expect((<HoldNote>notes[0]).holdLength).toBe(rest4);
        expect((<HoldNote>notes[1]).holdLength).toBe(rest4);
        expect((<HoldNote>notes[2]).holdLength).toBe(rest8);
        expect((<HoldNote>notes[3]).holdLength).toBe(rest8);
        expect(notes[0].measure).toBe(1);
        expect(notes[1].measure).toBe(1);
        expect(notes[2].measure).toBe(1);
        expect(notes[3].measure).toBe(1);
        expect(notes[4].measure).toBe(1);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(rest4);
        expect(notes[2].grid).toBe(rest4 * 2);
        expect(notes[3].grid).toBe(rest4 * 2 + rest8);
        expect(notes[4].grid).toBe(rest4 * 2 + rest8 * 2);
    });

    it('should handle each tap notes correctly', () => {
        const notes = parse('{4}12,34,5678,').getNoteObjects();
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(8);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.TAP);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.TAP);
        expect(notes[4].type).toBe(NoteType.TAP);
        expect(notes[5].type).toBe(NoteType.TAP);
        expect(notes[6].type).toBe(NoteType.TAP);
        expect(notes[7].type).toBe(NoteType.TAP);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(3);
        expect(notes[3].position).toBe(4);
        expect(notes[4].position).toBe(5);
        expect(notes[5].position).toBe(6);
        expect(notes[6].position).toBe(7);
        expect(notes[7].position).toBe(8);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(0);
        expect(notes[2].grid).toBe(rest4);
        expect(notes[3].grid).toBe(rest4);
        expect(notes[4].grid).toBe(rest4 * 2);
        expect(notes[5].grid).toBe(rest4 * 2);
        expect(notes[6].grid).toBe(rest4 * 2);
        expect(notes[7].grid).toBe(rest4 * 2);
    });

    it('should handle each tap notes correctly', () => {
        const notes = parse('{4}12,34,5678,').getNoteObjects();
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(8);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.TAP);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.TAP);
        expect(notes[4].type).toBe(NoteType.TAP);
        expect(notes[5].type).toBe(NoteType.TAP);
        expect(notes[6].type).toBe(NoteType.TAP);
        expect(notes[7].type).toBe(NoteType.TAP);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(3);
        expect(notes[3].position).toBe(4);
        expect(notes[4].position).toBe(5);
        expect(notes[5].position).toBe(6);
        expect(notes[6].position).toBe(7);
        expect(notes[7].position).toBe(8);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(0);
        expect(notes[2].grid).toBe(rest4);
        expect(notes[3].grid).toBe(rest4);
        expect(notes[4].grid).toBe(rest4 * 2);
        expect(notes[5].grid).toBe(rest4 * 2);
        expect(notes[6].grid).toBe(rest4 * 2);
        expect(notes[7].grid).toBe(rest4 * 2);
    });
});