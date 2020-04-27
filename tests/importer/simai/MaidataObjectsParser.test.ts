import ObjectsParser from "../../../src/importer/simai/MaidataObjectsParser";
import TouchArea from "../../../src/data/music/object/TouchArea";
import NoteType from "../../../src/data/music/object/NoteType";
import HoldNote from "../../../src/data/music/object/HoldNote";
import SlideNote from "../../../src/data/music/object/SlideNote";
import SlideType from "../../../src/data/music/object/SlideType";

const MEASURE_RESOLUTION = 384;
const DEFAULT_BPM = 120;
const parser = (data, measureResolution = MEASURE_RESOLUTION, defaultBpm = DEFAULT_BPM) => {
    const o = new ObjectsParser;
    o.parse(data, measureResolution, defaultBpm);
    return o;
};

describe('maidata objects parser', () => {
    it('should handle divisor correctly', () => {
        const notes = parser('{4}1,1,').noteObjects;
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
        const notes = parser('{1}1,{8}2,3,,,{4}4,5,').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        const rest8 = MEASURE_RESOLUTION / 8;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(5);
        expect(notes[0].measure).toBe(1);
        expect(notes[1].measure).toBe(2);
        expect(notes[2].measure).toBe(2);
        expect(notes[3].measure).toBe(2);
        expect(notes[4].measure).toBe(2);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(0);
        expect(notes[2].grid).toBe(rest8);
        expect(notes[3].grid).toBe(rest8 * 4);
        expect(notes[4].grid).toBe(rest8 * 4 + rest4);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(3);
        expect(notes[3].position).toBe(4);
        expect(notes[4].position).toBe(5);
        expect(notes[0].area).toBe(TouchArea.A);
        expect(notes[1].area).toBe(TouchArea.A);
        expect(notes[2].area).toBe(TouchArea.A);
        expect(notes[3].area).toBe(TouchArea.A);
        expect(notes[4].area).toBe(TouchArea.A);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.TAP);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.TAP);
        expect(notes[4].type).toBe(NoteType.TAP);
    });

    it('should handle BPM changes correctly', () => {
        const bpms = parser('(60){1}1,(90)2,').bpmObjects;
        expect(bpms).toBeDefined();
        expect(bpms.length).toBe(2);
        expect(bpms[0].bpm).toBe(60);
        expect(bpms[1].bpm).toBe(90);
        expect(bpms[0].measure).toBe(1);
        expect(bpms[1].measure).toBe(2);
    });

    it('should handle break notes correctly', () => {
        const notes = parser('{4}1,2b,7,8b,').noteObjects;
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
        const notes = parser('{4}1,2x,7,8x,').noteObjects;
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
        const notes = parser('{4}1,2h,7,8h,').noteObjects;
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
        const notes = parser('{4}1,2hx,7,8xh,').noteObjects;
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
        const notes = parser('{4}1,2$,7x$,8$b,').noteObjects;
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
        const notes = parser('{4}1h[4:1],2h[4:1],{8}3hx[8:1],4xh[8:1],5b,,').noteObjects;
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
        const notes = parser('{4}12,34,5678,').noteObjects;
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
        const notes = parser('{4}12,34,5678,').noteObjects;
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

    it('should handle each tap notes with slashes correctly', () => {
        const notes = parser('{4}1/2,3/4,').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.TAP);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.TAP);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(3);
        expect(notes[3].position).toBe(4);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(0);
        expect(notes[2].grid).toBe(rest4);
        expect(notes[3].grid).toBe(rest4);
    });

    it('should handle pseudo-each tap notes correctly', () => {
        const notes = parser('{4}1`2`3`4,').noteObjects;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.TAP);
        expect(notes[1].type).toBe(NoteType.TAP);
        expect(notes[2].type).toBe(NoteType.TAP);
        expect(notes[3].type).toBe(NoteType.TAP);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(2);
        expect(notes[2].position).toBe(3);
        expect(notes[3].position).toBe(4);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(1);
        expect(notes[2].grid).toBe(2);
        expect(notes[3].grid).toBe(3);
    });

    it('should handle touch tap notes correctly', () => {
        const notes = parser('{4}B1/B3,D5,D7,C`E2`E4,').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(7);
        expect(notes[0].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[1].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[2].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[3].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[4].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[5].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[6].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[0].position).toBe(1);
        expect(notes[1].position).toBe(3);
        expect(notes[2].position).toBe(5);
        expect(notes[3].position).toBe(7);
        expect(notes[4].position).toBeUndefined();
        expect(notes[5].position).toBe(2);
        expect(notes[6].position).toBe(4);
        expect(notes[0].area).toBe(TouchArea.B);
        expect(notes[1].area).toBe(TouchArea.B);
        expect(notes[2].area).toBe(TouchArea.D);
        expect(notes[3].area).toBe(TouchArea.D);
        expect(notes[4].area).toBe(TouchArea.C);
        expect(notes[5].area).toBe(TouchArea.E);
        expect(notes[6].area).toBe(TouchArea.E);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(0);
        expect(notes[2].grid).toBe(rest4);
        expect(notes[3].grid).toBe(rest4 * 2);
        expect(notes[4].grid).toBe(rest4 * 3);
        expect(notes[5].grid).toBe(rest4 * 3 + 1);
        expect(notes[6].grid).toBe(rest4 * 3 + 2);
    });

    it('should handle touch hold notes correctly', () => {
        const notes = parser('{4}Ch[4:1],,B1/B5,').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(3);
        expect(notes[0].type).toBe(NoteType.TOUCH_HOLD);
        expect(notes[1].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[2].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[0].area).toBe(TouchArea.C);
        expect(notes[1].area).toBe(TouchArea.B);
        expect(notes[2].area).toBe(TouchArea.B);
        expect(notes[0].position).toBeUndefined();
        expect(notes[1].position).toBe(1);
        expect(notes[2].position).toBe(5);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].grid).toBe(rest4 * 2);
        expect(notes[2].grid).toBe(rest4 * 2);
    });

    it('should handle touch fireworks correctly', () => {
        const notes = parser('{4}Chf[4:1],,Cfh[4:1],,C,,Cf,,1').noteObjects;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(5);
        expect(notes[0].type).toBe(NoteType.TOUCH_HOLD);
        expect(notes[1].type).toBe(NoteType.TOUCH_HOLD);
        expect(notes[2].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[3].type).toBe(NoteType.TOUCH_TAP);
        expect(notes[4].type).toBe(NoteType.TAP);
        expect(notes[0].area).toBe(TouchArea.C);
        expect(notes[1].area).toBe(TouchArea.C);
        expect(notes[2].area).toBe(TouchArea.C);
        expect(notes[3].area).toBe(TouchArea.C);
        expect(notes[4].area).toBe(TouchArea.A);
        expect(notes[0].position).toBeUndefined();
        expect(notes[1].position).toBeUndefined();
        expect(notes[2].position).toBeUndefined();
        expect(notes[3].position).toBeUndefined();
        expect(notes[4].position).toBe(1);
        expect(notes[0].firework).toBeTruthy();
        expect(notes[1].firework).toBeTruthy();
        expect(notes[2].firework).toBeFalsy();
        expect(notes[3].firework).toBeTruthy();
        expect(notes[4].firework).toBeFalsy();
    });

    it('should handle straight slide correctly', () => {
        const notes = parser('{4}1-4[4:1],').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(2);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(1);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(1);
        expect((<SlideNote>notes[1]).endPosition).toBe(4);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.STRAIGHT);
    });

    it('should handle break star correctly', () => {
        const notes = parser('{4}1b-4[4:1],').noteObjects;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(2);
        expect(notes[0].type).toBe(NoteType.BREAK_STAR);
    });

    it('should handle EX star correctly', () => {
        const notes = parser('{4}1x-4[4:1],').noteObjects;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(2);
        expect(notes[0].type).toBe(NoteType.EX_STAR);
    });

    it('should handle forced-ring tap correctly', () => {
        const notes = parser('{4}1@-4[4:1],').noteObjects;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(2);
        expect(notes[0].type).toBe(NoteType.TAP);
    });

    it('should handle forced-ring break correctly', () => {
        const notes = parser('{4}1@b-4[4:1],').noteObjects;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(2);
        expect(notes[0].type).toBe(NoteType.BREAK);
    });

    it('should handle forced-ring EX tap correctly', () => {
        const notes = parser('{4}1@x-4[4:1],').noteObjects;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(2);
        expect(notes[0].type).toBe(NoteType.EX_TAP);
    });

    it('should handle multiple straight slides from the same origin correctly', () => {
        const notes = parser('{4}5-8[4:1]*-1[2:1]*-2[1:1],').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(5);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(5);
        expect((<SlideNote>notes[1]).endPosition).toBe(8);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.STRAIGHT);
        expect(notes[2].type).toBe(NoteType.SLIDE);
        expect(notes[2].position).toBe(5);
        expect((<SlideNote>notes[2]).endPosition).toBe(1);
        expect((<SlideNote>notes[2]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[2]).travelDuration).toBe(rest4 * 2);
        expect((<SlideNote>notes[2]).slideType).toBe(SlideType.STRAIGHT);
        expect(notes[3].type).toBe(NoteType.SLIDE);
        expect(notes[3].position).toBe(5);
        expect((<SlideNote>notes[3]).endPosition).toBe(2);
        expect((<SlideNote>notes[3]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[3]).travelDuration).toBe(rest4 * 4);
        expect((<SlideNote>notes[3]).slideType).toBe(SlideType.STRAIGHT);
    });

    it('should handle no-star decorator correctly', () => {
        const notes = parser('{4}5-8[4:1],8?-3[4:1],').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(3);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(5);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(5);
        expect(notes[1].grid).toBe(0);
        expect((<SlideNote>notes[1]).endPosition).toBe(8);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.STRAIGHT);
        expect(notes[2].type).toBe(NoteType.SLIDE);
        expect(notes[2].position).toBe(8);
        expect(notes[2].grid).toBe(rest4);
        expect((<SlideNote>notes[2]).endPosition).toBe(3);
        expect((<SlideNote>notes[2]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[2]).travelDuration).toBe(rest4);
        expect((<SlideNote>notes[2]).slideType).toBe(SlideType.STRAIGHT);
    });

    it('should handle curve slide with ^ correctly', () => {
        let notes = parser('{8}2^7[16:3],8^5[16:3],5^8[16:3],7^2[16:3],').noteObjects; // Axeria
        const rest4 = MEASURE_RESOLUTION / 4;
        const rest8 = MEASURE_RESOLUTION / 8;
        const rest16 = MEASURE_RESOLUTION / 16;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(8);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(2);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(2);
        expect(notes[1].grid).toBe(0);
        expect((<SlideNote>notes[1]).endPosition).toBe(7);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.CURVE_L);
        expect(notes[2].type).toBe(NoteType.STAR);
        expect(notes[2].position).toBe(8);
        expect(notes[2].grid).toBe(rest8);
        expect(notes[3].type).toBe(NoteType.SLIDE);
        expect(notes[3].position).toBe(8);
        expect(notes[3].grid).toBe(rest8);
        expect((<SlideNote>notes[3]).endPosition).toBe(5);
        expect((<SlideNote>notes[3]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[3]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[3]).slideType).toBe(SlideType.CURVE_L);
        expect(notes[4].type).toBe(NoteType.STAR);
        expect(notes[4].position).toBe(5);
        expect(notes[4].grid).toBe(rest8 * 2);
        expect(notes[5].type).toBe(NoteType.SLIDE);
        expect(notes[5].position).toBe(5);
        expect(notes[5].grid).toBe(rest8 * 2);
        expect((<SlideNote>notes[5]).endPosition).toBe(8);
        expect((<SlideNote>notes[5]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[5]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[5]).slideType).toBe(SlideType.CURVE_R);
        expect(notes[6].type).toBe(NoteType.STAR);
        expect(notes[6].position).toBe(7);
        expect(notes[6].grid).toBe(rest8 * 3);
        expect(notes[7].type).toBe(NoteType.SLIDE);
        expect(notes[7].position).toBe(7);
        expect(notes[7].grid).toBe(rest8 * 3);
        expect((<SlideNote>notes[7]).endPosition).toBe(2);
        expect((<SlideNote>notes[7]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[7]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[7]).slideType).toBe(SlideType.CURVE_R);
    });

    it('should handle curve-L slide correctly', () => {
        let notes = parser('{8}2<7[16:3],8<5[16:3],').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        const rest8 = MEASURE_RESOLUTION / 8;
        const rest16 = MEASURE_RESOLUTION / 16;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(2);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(2);
        expect(notes[1].grid).toBe(0);
        expect((<SlideNote>notes[1]).endPosition).toBe(7);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.CURVE_L);
        expect(notes[2].type).toBe(NoteType.STAR);
        expect(notes[2].position).toBe(8);
        expect(notes[2].grid).toBe(rest8);
        expect(notes[3].type).toBe(NoteType.SLIDE);
        expect(notes[3].position).toBe(8);
        expect(notes[3].grid).toBe(rest8);
        expect((<SlideNote>notes[3]).endPosition).toBe(5);
        expect((<SlideNote>notes[3]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[3]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[3]).slideType).toBe(SlideType.CURVE_L);
    });

    it('should handle curve-R slide correctly', () => {
        let notes = parser('{8}5>8[16:3],7>2[16:3],').noteObjects;
        const rest4 = MEASURE_RESOLUTION / 4;
        const rest8 = MEASURE_RESOLUTION / 8;
        const rest16 = MEASURE_RESOLUTION / 16;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(4);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(5);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(5);
        expect(notes[1].grid).toBe(0);
        expect((<SlideNote>notes[1]).endPosition).toBe(8);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.CURVE_R);
        expect(notes[2].type).toBe(NoteType.STAR);
        expect(notes[2].position).toBe(7);
        expect(notes[2].grid).toBe(rest8);
        expect(notes[3].type).toBe(NoteType.SLIDE);
        expect(notes[3].position).toBe(7);
        expect(notes[3].grid).toBe(rest8);
        expect((<SlideNote>notes[3]).endPosition).toBe(2);
        expect((<SlideNote>notes[3]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[3]).travelDuration).toBe(rest16 * 3);
        expect((<SlideNote>notes[3]).slideType).toBe(SlideType.CURVE_R);
    });

    it('should handle center rotation slides correctly', () => {
        let notes = parser('{4}3p7[8:1]*-8[8:1]/4-7[8:1]*q8[8:1],').noteObjects; // [宴]Oshama Scramble! (Cranky Remix)
        const rest4 = MEASURE_RESOLUTION / 4;
        const rest8 = MEASURE_RESOLUTION / 8;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(6);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(3);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(3);
        expect(notes[1].grid).toBe(0);
        expect((<SlideNote>notes[1]).endPosition).toBe(7);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.CENTER_ROTATION_LEFT);
        expect(notes[2].type).toBe(NoteType.SLIDE);
        expect(notes[2].position).toBe(3);
        expect(notes[2].grid).toBe(0);
        expect((<SlideNote>notes[2]).endPosition).toBe(8);
        expect((<SlideNote>notes[2]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[2]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[2]).slideType).toBe(SlideType.STRAIGHT);
        expect(notes[3].type).toBe(NoteType.STAR);
        expect(notes[3].position).toBe(4);
        expect(notes[3].grid).toBe(0);
        expect(notes[4].type).toBe(NoteType.SLIDE);
        expect(notes[4].position).toBe(4);
        expect(notes[4].grid).toBe(0);
        expect((<SlideNote>notes[4]).endPosition).toBe(7);
        expect((<SlideNote>notes[4]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[4]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[4]).slideType).toBe(SlideType.STRAIGHT);
        expect(notes[5].type).toBe(NoteType.SLIDE);
        expect(notes[5].position).toBe(4);
        expect(notes[5].grid).toBe(0);
        expect((<SlideNote>notes[5]).endPosition).toBe(8);
        expect((<SlideNote>notes[5]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[5]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[5]).slideType).toBe(SlideType.CENTER_ROTATION_RIGHT);
    });

    it('should handle fan and letter S slides correctly', () => {
        let notes = parser('{32}1w5[8:1]*-5[8:1]*s5[8:1]*z5[8:1],').noteObjects; // [宴]Oshama Scramble! (Cranky Remix)
        const rest4 = MEASURE_RESOLUTION / 4;
        const rest8 = MEASURE_RESOLUTION / 8;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(5);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(1);
        expect(notes[0].grid).toBe(0);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(1);
        expect(notes[1].grid).toBe(0);
        expect((<SlideNote>notes[1]).endPosition).toBe(5);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.FAN);
        expect(notes[2].type).toBe(NoteType.SLIDE);
        expect(notes[2].position).toBe(1);
        expect(notes[2].grid).toBe(0);
        expect((<SlideNote>notes[2]).endPosition).toBe(5);
        expect((<SlideNote>notes[2]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[2]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[2]).slideType).toBe(SlideType.STRAIGHT);
        expect(notes[3].type).toBe(NoteType.SLIDE);
        expect(notes[3].position).toBe(1);
        expect(notes[3].grid).toBe(0);
        expect((<SlideNote>notes[3]).endPosition).toBe(5);
        expect((<SlideNote>notes[3]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[3]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[3]).slideType).toBe(SlideType.LETTER_S_LEFT);
        expect(notes[4].type).toBe(NoteType.SLIDE);
        expect(notes[4].position).toBe(1);
        expect(notes[4].grid).toBe(0);
        expect((<SlideNote>notes[4]).endPosition).toBe(5);
        expect((<SlideNote>notes[4]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[4]).travelDuration).toBe(rest8);
        expect((<SlideNote>notes[4]).slideType).toBe(SlideType.LETTER_S_RIGHT);
    });

    it('should handle refractive slides correctly', () => {
        let notes = parser('{1}1V36[2:1]/5V72[2:1],,4V27[2:1]/8V63[2:1],,').noteObjects; // Ultranova
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(8);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(1);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(1);
        expect((<SlideNote>notes[1]).endPosition).toBe(6);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest4 * 2);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.REFRACTIVE_R);
        expect(notes[2].type).toBe(NoteType.STAR);
        expect(notes[2].position).toBe(5);
        expect(notes[3].type).toBe(NoteType.SLIDE);
        expect(notes[3].position).toBe(5);
        expect((<SlideNote>notes[3]).endPosition).toBe(2);
        expect((<SlideNote>notes[3]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[3]).travelDuration).toBe(rest4 * 2);
        expect((<SlideNote>notes[3]).slideType).toBe(SlideType.REFRACTIVE_R);
        expect(notes[4].type).toBe(NoteType.STAR);
        expect(notes[4].position).toBe(4);
        expect(notes[5].type).toBe(NoteType.SLIDE);
        expect(notes[5].position).toBe(4);
        expect((<SlideNote>notes[5]).endPosition).toBe(7);
        expect((<SlideNote>notes[5]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[5]).travelDuration).toBe(rest4 * 2);
        expect((<SlideNote>notes[5]).slideType).toBe(SlideType.REFRACTIVE_L);
        expect(notes[6].type).toBe(NoteType.STAR);
        expect(notes[6].position).toBe(8);
        expect(notes[7].type).toBe(NoteType.SLIDE);
        expect(notes[7].position).toBe(8);
        expect((<SlideNote>notes[7]).endPosition).toBe(3);
        expect((<SlideNote>notes[7]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[7]).travelDuration).toBe(rest4 * 2);
        expect((<SlideNote>notes[7]).slideType).toBe(SlideType.REFRACTIVE_L);
    });

    it('should handle each sequence correctly', () => {
        let notes = parser('{1}3V15[2:1]/*3v5[2:1],,').noteObjects; // Ultranova
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(3);
        expect(notes[0].type).toBe(NoteType.STAR);
        expect(notes[0].position).toBe(3);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(3);
        expect((<SlideNote>notes[1]).endPosition).toBe(5);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest4 * 2);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.REFRACTIVE_L);
        expect(notes[2].type).toBe(NoteType.SLIDE);
        expect(notes[2].position).toBe(3);
        expect((<SlideNote>notes[2]).endPosition).toBe(5);
        expect((<SlideNote>notes[2]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[2]).travelDuration).toBe(rest4 * 2);
        expect((<SlideNote>notes[2]).slideType).toBe(SlideType.LETTER_V);
    });

    it('should handle side rotation sides correctly', () => {
        let notes = parser('{1}1bpp7[2:3]/5bpp3[2:3],,3h[4:7]/8qq2[2:1],2qq5[2:1],').noteObjects; // Ultranova
        const rest2 = MEASURE_RESOLUTION / 2;
        const rest4 = MEASURE_RESOLUTION / 4;
        expect(notes).toBeDefined();
        expect(notes.length).toBe(9);
        expect(notes[0].type).toBe(NoteType.BREAK_STAR);
        expect(notes[0].position).toBe(1);
        expect(notes[1].type).toBe(NoteType.SLIDE);
        expect(notes[1].position).toBe(1);
        expect((<SlideNote>notes[1]).endPosition).toBe(7);
        expect((<SlideNote>notes[1]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[1]).travelDuration).toBe(rest2 * 3);
        expect((<SlideNote>notes[1]).slideType).toBe(SlideType.SIDE_ROTATION_L);
        expect(notes[2].type).toBe(NoteType.BREAK_STAR);
        expect(notes[2].position).toBe(5);
        expect(notes[3].type).toBe(NoteType.SLIDE);
        expect(notes[3].position).toBe(5);
        expect((<SlideNote>notes[3]).endPosition).toBe(3);
        expect((<SlideNote>notes[3]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[3]).travelDuration).toBe(rest2 * 3);
        expect((<SlideNote>notes[3]).slideType).toBe(SlideType.SIDE_ROTATION_L);
        expect(notes[4].type).toBe(NoteType.HOLD);
        expect(notes[4].position).toBe(3);
        expect((<HoldNote>notes[4]).holdLength).toBe(rest4 * 7);
        expect(notes[5].type).toBe(NoteType.STAR);
        expect(notes[5].position).toBe(8);
        expect(notes[6].type).toBe(NoteType.SLIDE);
        expect(notes[6].position).toBe(8);
        expect((<SlideNote>notes[6]).endPosition).toBe(2);
        expect((<SlideNote>notes[6]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[6]).travelDuration).toBe(rest2);
        expect((<SlideNote>notes[6]).slideType).toBe(SlideType.SIDE_ROTATION_R);
        expect(notes[7].type).toBe(NoteType.STAR);
        expect(notes[7].position).toBe(2);
        expect(notes[8].type).toBe(NoteType.SLIDE);
        expect(notes[8].position).toBe(2);
        expect((<SlideNote>notes[8]).endPosition).toBe(5);
        expect((<SlideNote>notes[8]).waitDuration).toBe(rest4);
        expect((<SlideNote>notes[8]).travelDuration).toBe(rest2);
        expect((<SlideNote>notes[8]).slideType).toBe(SlideType.SIDE_ROTATION_R);
    });

    it('should throw error when encountering invalid object', () => {
        const parser = new ObjectsParser;
        expect(() => parser.parse('{1}X,', MEASURE_RESOLUTION, DEFAULT_BPM)).toThrowError('Unable to parse object: X');
    });

    it('should throw error when encountering invalid divisor', () => {
        const parser = new ObjectsParser;
        expect(() => parser.parse('{X}1,', MEASURE_RESOLUTION, DEFAULT_BPM)).toThrowError('Unrecognized length format: X');
    });

    it('should throw error when encountering invalid BPM', () => {
        const parser = new ObjectsParser;
        expect(() => parser.parse('(X){4}1,', MEASURE_RESOLUTION, DEFAULT_BPM)).toThrowError('Invalid BPM value: X');
    });

    it('should throw error when encountering invalid BPM', () => {
        const parser = new ObjectsParser;
        expect(() => parser.parse('(X){4}1,', MEASURE_RESOLUTION, DEFAULT_BPM)).toThrowError('Invalid BPM value: X');
    });
});