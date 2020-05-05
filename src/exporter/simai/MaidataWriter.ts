import isNumber from "is-number";
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
import {getSecondsPerBeat} from "../../util/TimeUtil";

type SlidePair = {
    star: Note,
    slides: SlideNote[]
};

export default class MaidataWriter {
    private _output: string;

    constructor(data: MusicData) {
        this._output = this.build(data);
    }

    get output(): string {
        return this._output;
    }

    private build(data: MusicData) {
        return this.renderMetadata(data) + this.renderScores(data);
    }

    private renderMetadata(data: MusicData): string {
        const rows: string[] = [];
        if (data.title) {
            rows.push(this.createEntry('title', data.title));
        }
        if (data.artist) {
            rows.push(this.createEntry('artist', data.artist));
        }
        if (data.trackPath) {
            rows.push(this.createEntry('track', 'track.mp3'));
        }

        rows.push(this.createEntry('first', '0'));

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
                    levels.set(difficulty, levelDecimal > 0 ? `${Math.floor(level)}+` : level.toString());
                }
            }
        }

        rows.push('');

        let hasDesigner = false;
        for (const difficulty of Array.from(designers.keys())) {
            const designer = designers.get(difficulty);
            if (designer) {
                rows.push(this.createEntry(`des_${difficulty}`, designer));
                hasDesigner = true;
            }
        }

        if (hasDesigner) {
            rows.push('');
        }

        let hasLevel = false;
        for (const difficulty of Array.from(levels.keys())) {
            const level = levels.get(difficulty);
            if (level) {
                rows.push(this.createEntry(`lv_${difficulty}`, level));
                hasLevel = true;
            }
        }

        if (hasLevel) {
            rows.push('');
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
                rows.push('');
            }
        }

        return rows.join('\r\n');
    }

    private renderObjects(noteObjects: Note[], bpmObjects: Bpm[], measureResolution: number, defaultBpm: number): string {
        if (!noteObjects.length) {
            return '';
        }

        const groupedBpm = this.createGroupedObjects(bpmObjects, measureResolution);
        const groupedNotes = this.createGroupedObjects(noteObjects, measureResolution);
        const mergedGroup = this.mergeGroupedObjects(groupedBpm, groupedNotes);
        const outputGroup = new Map<number, string[]>();
        let lastNormalTime, lastDivisor;
        for (const normalTime of Array.from(mergedGroup.keys())) {
            if (lastNormalTime != null) {
                const restGridLength = Math.abs(normalTime - lastNormalTime);
                let currentDivisor = measureResolution / restGridLength;
                if (currentDivisor < 1) {
                    currentDivisor = 4;
                } else if (currentDivisor % 1 >= 0.1) {
                    const multiplier = 1 / (currentDivisor % 1);
                    currentDivisor *= multiplier;
                    currentDivisor = currentDivisor % 1 < 0.5 ? Math.floor(currentDivisor) : Math.ceil(currentDivisor);
                }
                const divisorGridLength = measureResolution / currentDivisor;
                const restCount = restGridLength / divisorGridLength;
                let currentGroup = outputGroup.get(lastNormalTime);
                if (!lastDivisor || lastDivisor !== currentDivisor) {
                    currentGroup = this.applyGroupDivisor(currentGroup ? currentGroup : [], currentDivisor);
                    lastDivisor = currentDivisor;
                }
                currentGroup = this.applyGroupRests(currentGroup ? currentGroup : [], restCount);
                outputGroup.set(lastNormalTime, currentGroup);
            }

            const groupedObjects = mergedGroup.get(normalTime);
            outputGroup.set(normalTime, groupedObjects ? this.renderGroupedObjects(groupedObjects, measureResolution, defaultBpm) : []);
            lastNormalTime = normalTime;
        }

        if (outputGroup.size === 1) {
            const normalTime = outputGroup.keys().next().value;
            let group = outputGroup.get(normalTime);
            group = this.applyGroupDivisor(group ? group : [], 4);
            group = this.applyGroupRests(group ? group : [], 4);
            outputGroup.set(normalTime, group ? group : []);
        }

        let finalOutput = '', lastMeasure = 1;
        for (const normalTime of Array.from(outputGroup.keys())) {
            const group = outputGroup.get(normalTime);
            if (group) {
                finalOutput += group.join('');
                const measure = Math.floor(normalTime / measureResolution);
                if (measure !== lastMeasure) {
                    finalOutput += '\r\n';
                    lastMeasure = measure;
                }
            }
        }

        finalOutput += '\r\n{1},\r\nE\r\n';
        return finalOutput;
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

    private applyGroupDivisor(outputItem: string[], divisor: number) {
        let addIndex = 0;
        for (let i = 0; i < outputItem.length; i++) {
            const item = outputItem[i];
            if (this.parseBpm(item)) {
                addIndex = i + 1;
            } else if (this.parseDivisor(item)) {
                addIndex = i;
                outputItem = outputItem.splice(i, 1);
                i--;
            }
        }
        outputItem.splice(addIndex, 0, `{${divisor}}`);
        return outputItem;
    }

    private applyGroupRests(outputItem: string[], count: number) {
        if (outputItem && outputItem.length > 0 && outputItem[outputItem.length - 1].includes(',')) {
            outputItem = outputItem.splice(outputItem.length - 1, 1);
        }
        let value = '';
        for (let i = 0; i < count; i++) {
            value += ',';
        }
        outputItem.push(value);
        return outputItem;
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
        output.push(this.renderNoteObjects(noteObjects, measureResolution, currentBpm));
        return output;
    }

    private renderBpmObject(bpmObject: Bpm) {
        return `(${bpmObject.bpm})`;
    }

    private renderNoteObjects(noteObjects: Note[], measureResolution: number, bpm: number): string {
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

        for (const position of Array.from(slidePairs.keys())) {
            const pair = slidePairs.get(position);
            if (pair?.slides.length === 0) {
                singleObjects.push(pair.star);
                slidePairs.delete(position);
            }
        }

        for (const object of singleObjects) {
            output.push(this.renderNoteObject(object, measureResolution, bpm, false, true));
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

        return output.join('/');
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

    private isTolerablyRound(num: number) {
        const x = num % 1;
        return x < 0.1 || x >= 0.9;
    }

    private renderGridLength(length: number, measureResolution: number) {
        let left = measureResolution / length;
        let right = 1;
        let fallbackLeft = left;
        let fallbackRight = right;
        let fallbackSet = false, overflow = false;
        while (!this.isTolerablyRound(left) || !this.isTolerablyRound(right)) {
            const multiplier = !this.isTolerablyRound(left) ? 1 / (left % 1) : 1 / (right % 1);
            left *= multiplier;
            right *= multiplier;
            if (left > 64 || right > 64) {
                overflow = true;
                break;
            }
            if (!fallbackSet && left >= 1 && right >= 1) {
                fallbackLeft = left;
                fallbackRight = right;
                fallbackSet = true;
            }
        }
        if (overflow) {
            left = fallbackLeft;
            right = fallbackRight;
        }
        left = Math.round(left);
        right = Math.round(right);
        return `[${left}:${right}]`;
    }

    private renderFixedLength(waitDuration: number, travelDuration: number, measureResolution: number, bpm: number) {
        const waitSeconds = this.convertGridToSeconds(waitDuration, measureResolution, bpm);
        const travelSeconds = this.convertGridToSeconds(travelDuration, measureResolution, bpm);
        return `[${waitSeconds}##${travelSeconds}`;
    }

    private convertGridToSeconds(length: number, measureResolution: number, bpm: number) {
        const spb = getSecondsPerBeat(bpm);
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

    private parseBpm(item: string): number | undefined {
        const matches = item.match(/\((.*?)\)/);
        if (matches && matches.length > 0) {
            const value = Number(matches[1]);
            if (isNumber(value)) {
                return value;
            }
        }
        return undefined;
    }

    private parseDivisor(item: string): string | undefined {
        const matches = item.match(/{(.*?)}/);
        if (matches && matches.length > 0) {
            return matches[1];
        }
        return undefined;
    }

    private normalizeTime(measure: number, grid: number, measureResolution: number) {
        return measure * measureResolution + grid;
    }

    private createEntry(key: string, value?: string) {
        return `&${key}=${value}`;
    }
}