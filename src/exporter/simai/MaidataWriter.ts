import MusicData from "../../data/music/MusicData";
import Note from "../../data/music/object/Note";
import Bpm from "../../data/music/object/Bpm";
import NoteType from "../../data/music/object/NoteType";
import HoldNote from "../../data/music/object/HoldNote";
import SlideNote from "../../data/music/object/SlideNote";
import TouchArea from "../../data/music/object/TouchArea";
import SlideType from "../../data/music/object/SlideType";
import BaseObject from "../../data/music/object/BaseObject";
import {shiftPosition} from "../../util/NoteUtil";

type SlidePair = {
    star: Note,
    slides: SlideNote[]
};

export default class MaidataWriter {
    private _output: string;

    constructor(data: MusicData) {
        this._output = this.build(data);
    }

    private build(data: MusicData) {
        let output = this.renderMetadata(data) + this.renderScores(data);
        return output;
    }

    private renderMetadata(data: MusicData): string {
        const rows: string[] = [];
        rows.push(this.createEntry('title', data.title));
        rows.push(this.createEntry('artist', data.artist));

        const designers = new Map<number, string>();
        const levels = new Map<number, string>();
        for (const difficulty of Array.from(data.notesData.keys())) {
            const notesData = data.notesData.get(difficulty);
            if (notesData) {
                const designer = notesData.designer;
                const level = notesData.level;
                if (designer) {
                    designers.set(difficulty, designer);
                }
                if (level) {
                    const levelDecimal = level % 1;
                    levels.set(difficulty, levelDecimal > 0 ? level.toString() + '+' : level.toString());
                }
            }
        }

        rows.push('');

        for (const difficulty of Array.from(designers.keys())) {
            rows.push(this.createEntry(`des_${difficulty}`, designers.get(difficulty)));
        }

        rows.push('');

        for (const difficulty of Array.from(levels.keys())) {
            rows.push(this.createEntry(`lv_${difficulty}`, levels.get(difficulty)));
        }

        rows.push('');

        return rows.join('\r\n');
    }

    private renderScores(data: MusicData) {
        const rows: string[] = [];
        for (const difficulty of Array.from(data.notesData.keys())) {
            const notesData = data.notesData.get(difficulty);
            if (notesData) {
                const {noteObjects, bpmObjects} = notesData;
                let bpm = data.bpm;
                if (bpm == null && bpmObjects.length > 0) {
                    bpm = bpmObjects[0].bpm;
                } else {
                    bpm = 120;
                }
                const objects = this.renderObjects(noteObjects, bpmObjects, notesData.measureResolution, bpm);
                rows.push(this.createEntry(`inote_${difficulty}`, objects));
            }
        }

        return rows.join('\r\n');
    }

    private renderObjects(noteObjects: Note[], bpmObjects: Bpm[], measureResolution: number, defaultBpm: number): string {
        if (!noteObjects.length) {
            return '';
        }

        /**
         * 1. Group objects by normal time, eg.
         *    [Input Map]
         *    0 => [bpm, note, note]
         *    96 => [note, note]
         *    192 => [note]
         *    ...
         *    3456 => [bpm, note]
         * 2. Construct a map to describe the number of rests required between groups, eg.
         *    [Divisor Map]
         *    0 => {divisor: 4, count: 1}
         *    96 => {divisor: 4, count: 1}
         * 2. Consume BPM and construct output map by normal time, eg.
         *    [Input Map]
         *    0 => [bpm, note, note]
         *    ...3456 => [bpm, note]
         *    to
         *    [Input Map]
         *    0 => [note, note]
         *    ...3456 => [note]
         *    [Output Map<number, string>]
         *    0 => "(120)"
         *    ..3456 => "(90)"
         * 3. Consume notes, eg.
         *    [Input Map]
         *    0 => [note, note]
         *    96 => [note, note]
         *    to
         *    [Input Map]
         *    0 => []
         *    96 => []
         *    [Output Map]
         *    0 => "(120)1/2"
         *    96 => "1h[4:1]/8-5[4:1]"
         * 4. Construct output based on key (normal time), eg.
         *    0 => "(120)1/2"
         *    96 => "1h[4:1]/8-5[4:1]"
         */

        const groupedBpm = this.createGroupedObjects(bpmObjects, measureResolution);
        const groupedNotes = this.createGroupedObjects(noteObjects, measureResolution);
        const mergedGroup = this.mergeGroupedObjects(groupedBpm, groupedNotes);
        const outputGroup = new Map<number, string[]>();
        let shortestDivisor = 1, lastNormalTime;
        for (const normalTime of Array.from(mergedGroup.keys())) {
            if (lastNormalTime) {
                const currentDivisor = measureResolution / Math.abs(normalTime - lastNormalTime);
                if (currentDivisor > shortestDivisor) {
                    shortestDivisor = currentDivisor;
                }
            }

            const groupedObjects = mergedGroup.get(normalTime);
            outputGroup.set(normalTime, groupedObjects ? this.renderGroupedObjects(groupedObjects, measureResolution, defaultBpm) : []);
            lastNormalTime = normalTime;
        }
        return '';

        /*
        let content = `(${defaultBpm})`;
        const lastObject = noteObjects[noteObjects.length - 1];
        const lastGrid = lastObject.measure * measureResolution + lastObject.grid;
        let currentGrid = 0, lastNote, bpm = defaultBpm;
        while (measure < lastMeasure && grid < lastGrid) {
            const noteObject = noteObjects[0];
            const bpmObject = bpmObjects[0];

            if (bpmObject.measure <= measure && bpmObject.grid <= grid) {
                bpm = bpmObject.bpm;
                content += `(${bpmObject.bpm})`;
                bpmObjects = bpmObjects.splice(0, 1);
            }

            if (noteObject.measure <= measure && noteObject.grid <= grid) {
                content += this.renderNoteObjects(noteObject, measureResolution, bpm, lastNote);
                lastNote = noteObject;
                noteObjects = noteObjects.splice(0, 1);
            }

            grid++;
            if (grid > measureResolution) {
                grid -= measureResolution;
                measure++;
            }
        }

         */
    }

    private createGroupedObjects(objects: BaseObject[], measureResolution: number) {
        const groupedObjects = new Map<number, BaseObject[]>();
        for (const object of objects) {
            const normalTime = this.normalizeTime(object.measure, object.grid, measureResolution);
            if (!groupedObjects.get(normalTime)) {
                groupedObjects.set(normalTime, []);
            }

            groupedObjects.get(normalTime)?.push(object);
        }
        return groupedObjects;
    }

    private mergeGroupedObjects(...manyGroupedObjects: Map<number, BaseObject[]>[]) {
        const result = new Map<number, BaseObject[]>();
        for (const groupedObjects of manyGroupedObjects) {
            for (const normalTime of Array.from(groupedObjects.keys())) {
                if (!result.get(normalTime)) {
                    result.set(normalTime, []);
                }

                const objects = groupedObjects.get(normalTime);
                if (objects) {
                    result.get(normalTime)?.push(...objects);
                }
            }
        }
        return result;
    }

    private renderGroupedObjects(objects: BaseObject[], measureResolution: number, bpm: number): string[] {
        let currentBpm = bpm;
        let output: string[] = [];
        const noteObjects: Note[] = [];
        for (const object of objects) {
            if ('bpm' in object) {
                currentBpm = (<Bpm>object).bpm;
                output.push(this.renderBpmObject(object));
            } else {
                noteObjects.push(<Note>object);
            }
        }
        output.push(...this.renderNoteObjects(noteObjects, measureResolution, currentBpm));
        return output;
    }

    private renderBpmObject(bpmObject: Bpm) {
        return `(${bpmObject.bpm}`;
    }

    private renderNoteObjects(noteObjects: Note[], measureResolution: number, bpm: number): string[] {
        let output: string[] = [];
        const slidePairs = new Map<number, SlidePair>();
        const singleObjects: Note[] = [];
        for (const object of noteObjects) {
            if (object.type === NoteType.STAR || object.type === NoteType.BREAK_STAR || object.type === NoteType.EX_STAR) {
                if (object.position && !slidePairs.get(object.position)) {
                    slidePairs.set(object.position, { star: object, slides: [] });
                    continue;
                }
            } else if (object.type === NoteType.SLIDE) {
                if (object.position && slidePairs.get(object.position)) {
                    slidePairs.get(object.position)?.slides.push(<SlideNote>object);
                    continue;
                }
            }
            singleObjects.push(object);
        }

        for (const object of singleObjects) {
            output.push(this.renderNoteObject(object, measureResolution, bpm));
        }

        for (const position of Array.from(slidePairs.keys())) {
            const pair = slidePairs.get(position);
            if (pair) {
                let slideOutput = this.renderNoteObject(pair.star, measureResolution, bpm, true);
                let firstSlide = true;
                for (const slide of pair.slides) {
                    if (slide.position) {
                        if (!firstSlide) {
                            slideOutput += '*';
                        }
                        slideOutput += this.renderSlideTail(slide, measureResolution, bpm);
                        firstSlide = false;
                    } else {
                        throw new Error(`Unexpected empty slide start position: ${slide}`);
                    }
                }

                output.push(slideOutput);
            }
        }

        return output;
    }

    private renderNoteObject(note: Note, measureResolution: number, bpm: number, applyForceRing: boolean = false, applyForceStar: boolean = false) {
        let output = this.renderPosition(note, applyForceRing, applyForceStar);

        if (note.type === NoteType.HOLD || note.type === NoteType.EX_HOLD || note.type === NoteType.TOUCH_HOLD) {
            const holdNote = <HoldNote>note;
            if (holdNote.holdLength) {
                output += this.renderGridLength(holdNote.holdLength, measureResolution);
            }
        } else if (note.type === NoteType.SLIDE) {
            const slideNote = <SlideNote>note;
            output += this.renderSlideTail(slideNote, measureResolution, bpm);
        }
        return output;
    }

    private renderPosition(note: Note, applyForceRing: boolean = false, applyForceStar: boolean = false) {
        let output = '';
        if (note.area !== TouchArea.A) {
            output += note.area;
        }

        if (note.area !== TouchArea.C) {
            output += note.position;
        }

        if (note.area === TouchArea.C && note.firework && (note.type === NoteType.TOUCH_TAP || note.type === NoteType.TOUCH_HOLD)) {
            output += 'f';
        }

        if (note.type === NoteType.BREAK || note.type === NoteType.BREAK_STAR) {
            output += 'b';
        } else if (note.type === NoteType.HOLD || note.type === NoteType.EX_HOLD || note.type === NoteType.TOUCH_HOLD) {
            output += 'h';
        }

        if (note.type === NoteType.EX_TAP || note.type === NoteType.EX_HOLD || note.type === NoteType.EX_STAR) {
            output += 'x';
        }

        if (applyForceRing && (note.type === NoteType.TAP || note.type === NoteType.BREAK || note.type === NoteType.EX_TAP)) {
            output += '@';
        }

        if (applyForceStar && (note.type === NoteType.STAR || note.type === NoteType.BREAK_STAR || note.type === NoteType.EX_STAR)) {
            output += '$';
        }

        return output;
    }

    private renderSlideTail(slideNote: SlideNote, measureResolution: number, bpm: number) {
        let output = '';
        if (slideNote.position) {
            const slideNotation = this.isLegacyCurveType(slideNote.slideType, slideNote.position, slideNote.endPosition) ?
                '^' : this.renderSlideNotation(slideNote.slideType);
            const refractPosition = slideNote.slideType === SlideType.REFRACTIVE_L ?
                shiftPosition(slideNote.position.toString(), 2, -1) :
                (slideNote.slideType === SlideType.REFRACTIVE_R ?
                    shiftPosition(slideNote.position.toString(), 2, 1) : '');
            output += slideNotation + refractPosition + slideNote.endPosition;
            if (slideNote.waitDuration === measureResolution / 4) {
                output += this.renderGridLength(slideNote.travelDuration, measureResolution);
            } else {
                output += this.renderFixedLength(slideNote.waitDuration, slideNote.travelDuration, measureResolution, bpm);
            }
        } else {
            throw new Error(`Unexpected empty slide position: ${slideNote}`);
        }
        return output;
    }

    private renderGridLength(length: number, measureResolution: number) {
        let left = measureResolution / length;
        let right = 1;
        if (left < 1) {
            const multiplier = 1 / left;
            left *= multiplier;
            right *= multiplier;
        }
        return `[${left}:${right}]`;
    }

    private renderFixedLength(waitDuration: number, travelDuration: number, measureResolution: number, bpm: number) {
        const waitSeconds = this.convertGridToSeconds(waitDuration, measureResolution, bpm);
        const travelSeconds = this.convertGridToSeconds(travelDuration, measureResolution, bpm);
        return `[${waitSeconds}##${travelSeconds}`;
    }

    private convertGridToSeconds(length: number, measureResolution: number, bpm: number) {
        const bps = bpm / 60;
        const spb = 1 / bps;
        const gridsPerBeat = measureResolution / 4;
        return length / gridsPerBeat * spb;
    }

    private isLegacyCurveType(type: SlideType, startPosition: number, endPosition: number) {
        if (type === SlideType.CURVE_L || type === SlideType.CURVE_R) {
            return (type === SlideType.CURVE_L && this.isLegacyCurvePosition(startPosition, endPosition, -1)) ||
                (type === SlideType.CURVE_R && this.isLegacyCurvePosition(startPosition, endPosition, 1));
        }
        return false;
    }

    private isLegacyCurvePosition(startPosition: number, endPosition: number, direction: number) {
        const strStart = startPosition.toString();
        let isLegacy = false;
        for (let i = 1; i <= 3; i++) {
            if (shiftPosition(strStart, i, direction < 0 ? -1 : 1) === endPosition) {
                isLegacy = true;
                break;
            }
        }
        return isLegacy;
    }

    private renderSlideNotation(type: SlideType) {
        switch (type) {
            case SlideType.STRAIGHT:
                return '-';
            case SlideType.CURVE_L:
                return '<';
            case SlideType.CURVE_R:
                return '>';
            case SlideType.LETTER_V:
                return 'v';
            case SlideType.LETTER_S_LEFT:
                return 's';
            case SlideType.LETTER_S_RIGHT:
                return 'z';
            case SlideType.CENTER_ROTATION_LEFT:
                return 'p';
            case SlideType.CENTER_ROTATION_RIGHT:
                return 'q';
            case SlideType.SIDE_ROTATION_L:
                return 'pp';
            case SlideType.SIDE_ROTATION_R:
                return 'qq';
            case SlideType.REFRACTIVE_L:
            case SlideType.REFRACTIVE_R:
                return 'V';
            case SlideType.FAN:
                return 'w';
        }
    }

    private normalizeTime(measure: number, grid: number, measureResolution: number) {
        return measure * measureResolution + grid;
    }

    private createEntry(key: string, value?: string) {
        return `&${key}=${value}`;
    }
}