import ScoreParser from "../../../src/importer/ma2/ScoreParser";
import TouchArea from "../../../src/data/music/object/TouchArea";
import NoteType from "../../../src/data/music/object/NoteType";
import HoldNote from "../../../src/data/music/object/HoldNote";
import SlideNote from "../../../src/data/music/object/SlideNote";
import SlideType from "../../../src/data/music/object/SlideType";

describe('ma2 score parser', () => {
    it('should parse tap correctly', async () => {
        const data = 'TAP\t1\t0\t0\r\nTAP\t2\t0\t7';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.TAP);
        expect(noteObjects[1].type).toBe(NoteType.TAP);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.tapCount).toBe(2);
        expect(statistics.maxTapScore).toBe(1000);
    });

    it('should parse hold correctly', async () => {
        const data = 'HLD\t1\t0\t0\t96\r\nHLD\t1\t96\t7\t96';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.HOLD);
        expect(noteObjects[1].type).toBe(NoteType.HOLD);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect((<HoldNote>noteObjects[0]).holdLength).toBe(96);
        expect((<HoldNote>noteObjects[1]).holdLength).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(1);
        expect(noteObjects[1].grid).toBe(96);
        expect(statistics.holdCount).toBe(2);
        expect(statistics.maxHoldScore).toBe(2000);
    });

    it('should parse break correctly', async () => {
        const data = 'BRK\t1\t0\t0\r\nBRK\t2\t0\t7';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.BREAK);
        expect(noteObjects[1].type).toBe(NoteType.BREAK);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.breakCount).toBe(2);
        expect(statistics.judgeTapCount).toBe(2);
        expect(statistics.maxBreakScore).toBe(5200);
    });

    it('should parse star correctly', async () => {
        const data = 'STR\t1\t0\t0\r\nSTR\t2\t0\t7';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.STAR);
        expect(noteObjects[1].type).toBe(NoteType.STAR);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.starCount).toBe(2);
        expect(statistics.maxTapScore).toBe(1000);
    });

    it('should parse break star correctly', async () => {
        const data = 'BST\t1\t0\t0\r\nBST\t2\t0\t7';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.BREAK_STAR);
        expect(noteObjects[1].type).toBe(NoteType.BREAK_STAR);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.breakStarCount).toBe(2);
        expect(statistics.judgeTapCount).toBe(2);
        expect(statistics.maxBreakScore).toBe(5200);
    });

    it('should parse EX tap correctly', async () => {
        const data = 'XTP\t1\t0\t0\r\nXTP\t2\t0\t7';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.EX_TAP);
        expect(noteObjects[1].type).toBe(NoteType.EX_TAP);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.exTapCount).toBe(2);
        expect(statistics.judgeTapCount).toBe(2);
        expect(statistics.maxTapScore).toBe(1000);
    });

    it('should parse EX star correctly', async () => {
        const data = 'XST\t1\t0\t0\r\nXST\t2\t0\t7';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.EX_STAR);
        expect(noteObjects[1].type).toBe(NoteType.EX_STAR);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.exStarCount).toBe(2);
        expect(statistics.judgeTapCount).toBe(2);
        expect(statistics.maxTapScore).toBe(1000);
    });

    it('should parse EX hold correctly', async () => {
        const data = 'XHO\t1\t0\t0\t96\r\nXHO\t1\t96\t7\t96';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.EX_HOLD);
        expect(noteObjects[1].type).toBe(NoteType.EX_HOLD);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBe(8);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect(noteObjects[1].area).toBe(TouchArea.A);
        expect((<HoldNote>noteObjects[0]).holdLength).toBe(96);
        expect((<HoldNote>noteObjects[1]).holdLength).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(1);
        expect(noteObjects[1].grid).toBe(96);
        expect(statistics.exHoldCount).toBe(2);
        expect(statistics.maxHoldScore).toBe(2000);
    });

    it('should parse touch tap correctly', async () => {
        const data = 'TTP\t1\t0\t0\tB\t0\tM1\r\nTTP\t2\t0\t0\tC\t1\tM1';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.TOUCH_TAP);
        expect(noteObjects[1].type).toBe(NoteType.TOUCH_TAP);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[1].position).toBeUndefined();
        expect(noteObjects[0].area).toBe(TouchArea.B);
        expect(noteObjects[1].area).toBe(TouchArea.C);
        expect(noteObjects[0].firework).toBeUndefined();
        expect(noteObjects[1].firework).toBeTruthy();
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.touchTapCount).toBe(2);
        expect(statistics.maxTapScore).toBe(1000);
    });

    it('should parse touch hold correctly', async () => {
        const data = 'THO\t1\t0\t0\t192\tC\t0\tM1\r\nTHO\t2\t0\t0\t192\tC\t1\tM1';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(2);
        expect(noteObjects[0].type).toBe(NoteType.TOUCH_HOLD);
        expect(noteObjects[1].type).toBe(NoteType.TOUCH_HOLD);
        expect(noteObjects[0].position).toBeUndefined();
        expect(noteObjects[1].position).toBeUndefined();
        expect(noteObjects[0].area).toBe(TouchArea.C);
        expect(noteObjects[1].area).toBe(TouchArea.C);
        expect(noteObjects[0].firework).toBeFalsy();
        expect(noteObjects[1].firework).toBeTruthy();
        expect((<HoldNote>noteObjects[0]).holdLength).toBe(192);
        expect((<HoldNote>noteObjects[1]).holdLength).toBe(192);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(noteObjects[1].measure).toBe(2);
        expect(noteObjects[1].grid).toBe(0);
        expect(statistics.touchHoldCount).toBe(2);
        expect(statistics.maxHoldScore).toBe(2000);
    });

    it('should parse straight slide correctly', async () => {
        const data = 'SI_\t1\t0\t0\t96\t96\t3';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.STRAIGHT);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(4);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse curve L slide correctly', async () => {
        const data = 'SCL\t1\t0\t0\t96\t96\t6';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.CURVE_L);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(7);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse curve R slide correctly', async () => {
        const data = 'SCR\t1\t0\t0\t96\t96\t2';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.CURVE_R);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(3);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse center rotation left slide correctly', async () => {
        const data = 'SUL\t1\t0\t0\t96\t96\t6';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.CENTER_ROTATION_LEFT);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(7);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse center rotation right slide correctly', async () => {
        const data = 'SUR\t1\t0\t0\t96\t96\t2';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.CENTER_ROTATION_RIGHT);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(3);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse letter S left slide correctly', async () => {
        const data = 'SSL\t1\t0\t0\t96\t96\t4';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.LETTER_S_LEFT);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(5);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse letter S right slide correctly', async () => {
        const data = 'SSR\t1\t0\t0\t96\t96\t4';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.LETTER_S_RIGHT);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(5);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse letter V slide correctly', async () => {
        const data = 'SV_\t1\t0\t0\t96\t96\t3';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.LETTER_V);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(4);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse side rotation L slide correctly', async () => {
        const data = 'SXL\t1\t0\t0\t96\t96\t3';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.SIDE_ROTATION_L);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(4);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse side rotation R slide correctly', async () => {
        const data = 'SXR\t1\t0\t0\t96\t96\t5';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.SIDE_ROTATION_R);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(6);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse side refractive L slide correctly', async () => {
        const data = 'SLL\t1\t0\t0\t96\t96\t4';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.REFRACTIVE_L);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(5);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse side refractive R slide correctly', async () => {
        const data = 'SLR\t1\t0\t0\t96\t96\t5';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.REFRACTIVE_R);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(6);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });

    it('should parse fan slide correctly', async () => {
        const data = 'SF_\t1\t0\t0\t96\t96\t4';
        const parser = new ScoreParser;
        const {noteObjects, statistics} = await parser.parse(data);
        expect(noteObjects).toBeDefined();
        expect(noteObjects.length).toBe(1);
        expect(noteObjects[0].type).toBe(NoteType.SLIDE);
        expect(noteObjects[0].position).toBe(1);
        expect(noteObjects[0].area).toBe(TouchArea.A);
        expect((<SlideNote>noteObjects[0]).slideType).toBe(SlideType.FAN);
        expect((<SlideNote>noteObjects[0]).endPosition).toBe(5);
        expect((<SlideNote>noteObjects[0]).waitDuration).toBe(96);
        expect((<SlideNote>noteObjects[0]).travelDuration).toBe(96);
        expect(noteObjects[0].measure).toBe(1);
        expect(noteObjects[0].grid).toBe(0);
        expect(statistics.slideCount).toBe(1);
        expect(statistics.maxSlideScore).toBe(1500);
    });
});
