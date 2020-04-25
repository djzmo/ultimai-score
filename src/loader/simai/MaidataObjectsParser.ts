import Note from "../../data/music/object/Note";
import Bpm from "../../data/music/object/Bpm";
import TimeSignature from "../../data/music/object/TimeSignature";
import TouchArea from "../../data/music/object/TouchArea";
import NoteType from "../../data/music/object/NoteType";
import {start} from "repl";
import SlideNote from "../../data/music/object/SlideNote";
import {split} from "ts-node";

export default class MaidataObjectsParser {
    private noteObjects: Note[];
    private bpmObjects: Bpm[];
    private timeSignatureObjects: TimeSignature[];

    constructor(data: string, gridsPerMeasure: number, defaultBpm: number, defaultMeasureDivisor: number = 4) {
        this.bpmObjects = [];
        this.timeSignatureObjects = [];
        this.noteObjects = this.load(data, gridsPerMeasure, defaultBpm, defaultMeasureDivisor);
    }

    getNoteObjects() {
        return this.noteObjects;
    }

    getBpmObjects() {
        return this.bpmObjects;
    }

    getTimeSignatureObjects() {
        return this.timeSignatureObjects;
    }

    private load(data: string, gridsPerMeasure: number, defaultBpm: number, defaultMeasureDivisor: number) {
        this.noteObjects = [];
        this.bpmObjects = [];
        this.timeSignatureObjects = [];

        const items = data.split(',');
        items.forEach((value: string, index: number) => items[index] = value.trim());
        const resultNoteObjects = [];
        let bpm = defaultBpm;
        let measureDivisor = defaultMeasureDivisor;
        let measure = 1, grid = 0;
        for (let item of items) {
            const newBpm = this.parseBpm(item);
            if (newBpm != null) {
                item = this.trimBpm(item);
                bpm = newBpm;
                this.bpmObjects.push({bpm, measure, grid});
            }

            const newMeasureDivisor = this.parseMeasureDivisor(item, bpm);
            if (newMeasureDivisor != null) {
                measureDivisor = newMeasureDivisor;
                item = this.trimMeasureDivisor(item);
            }

            const noteObjects = this.parseEach(item, gridsPerMeasure, bpm, measureDivisor);
            if (noteObjects != null) {
                this.noteObjects.push(...noteObjects);
            }

            grid += gridsPerMeasure / measureDivisor;
            if (grid >= gridsPerMeasure) {
                grid -= gridsPerMeasure;
                measure++;
            }
        }
        return resultNoteObjects;
    }

    private parseMeasureDivisor(item: string, bpm: number): number | null {
        const matches = item.match(/{(\d+|#\d+\.?\d*)}/);
        if (matches != null && matches.length > 0) {
            const value = matches[0];
            if (value.includes('#')) {
                return this.toNormalDivisor(value, bpm);
            } else if (!isNaN(Number(value))) {
                return parseInt(value);
            } else {
                throw new Error(`Invalid time signature in ${item}`);
            }
        }
        return null;
    }

    private trimMeasureDivisor(item: string): string {
        return item.replace(/{(\d+|#\d+\.?\d*)}/g, '');
    }

    private parseBpm(item: string): number | null {
        const matches = item.match(/\((\d+\.?\d*)\)/);
        if (matches != null && matches.length > 0) {
            const value = parseFloat(matches[0]);
            if (!isNaN(value)) {
                return value;
            } else {
                throw new Error(`Invalid BPM value in ${item}`);
            }
        }
        return null;
    }

    private trimBpm(item: string): string {
        return item.replace(/\((\d+\.?\d*)\)/g, '');
    }

    private parseEach(item: string, gridsPerMeasure: number, bpm: number, measureDivisor: number): Note[] {
        let eachNotes: Note[] = [];
        if (item.length === 2 && !isNaN(Number(item))) {
            const matches = item.match(/([1-8])/g);
            if (matches != null && matches.length > 0) {
                for (const match of matches) {
                    const note = this.parseSingle(match, gridsPerMeasure, bpm, measureDivisor);
                    if (note != null) {
                        eachNotes.push(note);
                    }
                }
            }
        } else {
            const matches = item.match(/(?:[\/`])?([a-zA-Z0-9\[\]:.^<>*?!\-@$#`]+)/g);
            if (matches != null && matches.length > 0) {
                let pseudoIndex = 0;
                for (const match of matches) {
                    const isPseudo = match.charAt(0) === '`';
                    const isMultiple = match.charAt(0) === '/' || isPseudo;
                    const notes = this.parseMultiple(isMultiple ? match.substring(1) : match, gridsPerMeasure, bpm, measureDivisor, pseudoIndex++);
                    if (notes.length > 0) {
                        eachNotes = eachNotes.concat(notes);
                    }
                }
            }
        }
        return eachNotes;
    }

    private parseMultiple(item: string, gridsPerMeasure: number, bpm: number, measureDivisor: number, pseudoIndex?: number): Note[] {
        const matches = item.match(/(?:\*!?)?([a-zA-Z0-9\[\]:.^<>?!\-@$#`]+)/g);
        const notes: Note[] = [];
        if (matches != null && matches.length > 0) {
            let startPosition = parseInt(matches[0].substring(0, 1));
            let lastEndPosition = -1;
            for (const match of matches) {
                const isMultipleEnding = match.charAt(0) === '*';
                const isSequenceWithStar = match.charAt(0) === '?';
                const isSequenceWithoutStar = match.charAt(0) === '!';
                const isSequence = isMultipleEnding || isSequenceWithStar || isSequenceWithoutStar;
                const note = this.parseSingle(isSequence ? startPosition.toString() + match.substring(1) : match, gridsPerMeasure, bpm, measureDivisor);
                if (note != null) {
                    if ('slideType' in note) {
                        const slideNote = <SlideNote> note;
                        if (isSequenceWithStar || isSequenceWithoutStar) {
                            slideNote.position = lastEndPosition;
                        }
                        lastEndPosition = slideNote.endPosition;
                        notes.push(slideNote);
                    } else {
                        notes.push(note);
                    }
                }
            }
        }
        return notes;
    }

    private parseSingle(item: string, gridsPerMeasure: number, bpm: number, measureDivisor: number): Note | null {
        const matches = item.match(/^([1-8]|[ABDE][1-8]|C)([@$bfhx]{0,3})?([-^<>Vpqsvwz]{0,2})?([1-8]{1,2})?(\[\d+[:|#]{1,2}\d+])?/);
        if (matches != null && matches.length > 0) {
            const startPosition = matches[0];
            const decoratorOrSlideNotationOrLength = matches[1];
            const slideNotationOrEndPositionOrLength = matches[2];
            const endPositionOrLength = matches[3];
            const possiblyLength = matches[4];
            let decorators, slideNotation, endPosition, length;

            // Grouping
            if (this.isDecorator(decoratorOrSlideNotationOrLength)) {
                decorators = decoratorOrSlideNotationOrLength;
            }
            if (this.isSlideNotation(decoratorOrSlideNotationOrLength) || this.isSlideNotation(slideNotationOrEndPositionOrLength)) {
                slideNotation = this.isSlideNotation(decoratorOrSlideNotationOrLength) ?
                    decoratorOrSlideNotationOrLength :
                    slideNotationOrEndPositionOrLength;
            }
            if (this.isEndPosition(slideNotationOrEndPositionOrLength) || this.isEndPosition(endPositionOrLength)) {
                endPosition = this.isEndPosition(slideNotationOrEndPositionOrLength) ?
                    slideNotationOrEndPositionOrLength :
                    endPositionOrLength;
            }
            if (this.isLength(decoratorOrSlideNotationOrLength) || this.isLength(slideNotationOrEndPositionOrLength) ||
                this.isLength(endPositionOrLength) || this.isLength(possiblyLength)) {
                length = this.isLength(decoratorOrSlideNotationOrLength) ? decoratorOrSlideNotationOrLength :
                    (this.isLength(slideNotationOrEndPositionOrLength) ? slideNotationOrEndPositionOrLength :
                        (this.isLength(endPositionOrLength) ? endPositionOrLength : possiblyLength));
            }

            // Validations
            if (!this.isButtonPosition(startPosition) && !this.isTouchPosition(startPosition)) {
                throw new Error(`Invalid start position: ${item}`);
            }
            if (slideNotation != null && endPosition == null) {
                throw new Error(`Missing end position for slide: ${item}`);
            }
            if (endPosition != null && slideNotation == null) {
                throw new Error(`Missing mandatory slide notation for slide: ${item}`);
            }
            if (slideNotation != null && endPosition != null && length == null) {
                throw new Error(`Missing length for slide: ${item}`);
            }
            if (slideNotation != null && endPosition != null && this.isTouchPosition(endPosition)) {
                throw new Error(`Illegal end position for slide: ${item}`);
            }
            if (slideNotation != null && this.isTouchPosition(startPosition)) {
                throw new Error(`Illegal start position for slide: ${item}`);
            }
            if (this.hasHoldDecorator(decorators)) {
                if (endPosition != null) {
                    throw new Error(`Illegal end position for hold: ${item}`);
                } else if (this.hasBreakDecorator(decorators)) {
                    throw new Error(`Illegal break decorator for hold: ${item}`);
                } else if (this.hasForceRingDecorator(decorators) || this.hasForceStarDecorator(decorators)) {
                    throw new Error(`Illegal force decorator for hold: ${item}`);
                } else if (length == null) {
                    throw new Error(`Missing mandatory length for hold: ${item}`);
                }
            }
            if (this.hasFireworkDecorator(decorators)) {
                if (startPosition !== 'C') {
                    throw new Error(`Illegal start position for firework decorator: ${item}`);
                } else if (this.hasBreakDecorator(decorators)) {
                    throw new Error(`Illegal break decorator for firework decorator: ${item}`)
                } else if (this.hasForceRingDecorator(decorators) || this.hasForceStarDecorator(decorators)) {
                    throw new Error(`Illegal force decorator for firework decorator: ${item}`);
                } else if (this.hasExDecorator(decorators)) {
                    throw new Error(`Illegal EX decorator for firework decorator: ${item}`);
                }
            }
            if (this.hasBreakDecorator(decorators)) {
                if (this.hasExDecorator(decorators)) {
                    throw new Error(`Illegal EX decorator for break decorator: ${item}`);
                } else if (this.isTouchPosition(decorators)) {
                    throw new Error(`Invalid start position for break decorator: ${item}`);
                }
            }
        }
    }

    private toNormalDivisor(value: string, defaultBpm: number) {
        let bpm = defaultBpm;
        if (value.indexOf('#') !== -1) {
            if (value.indexOf('##') > 0) {
                const splitValue = value.split('##');
                const waitDuration = parseFloat(splitValue[0]);
                const travelDuration = parseFloat(splitValue[1]);
                if (isNaN(waitDuration) || isNaN(travelDuration)) {
                    throw new Error(`Conversion failed due to invalid length: ${value}`);
                }
                // TODO
                return null;
            } else {
                let valueSeconds = parseFloat(value.substring(1));
                if (value.indexOf('#') > 0) {
                    const splitValue = value.split('#');
                    bpm = parseFloat(splitValue[0]);
                    valueSeconds = parseFloat(splitValue[1]);
                    if (isNaN(bpm) || isNaN(valueSeconds)) {
                        throw new Error(`Conversion failed due to invalid length: ${value}`);
                    }
                }
                const bps = bpm / 60;
                const secondsPerBeat = 1 / bps;
                const measureDivisor = secondsPerBeat / valueSeconds * 4;
                if (measureDivisor % 1 !== 0) {
                    throw new Error(`measureDivisor is not a whole number: ${value}`);
                } else {
                    return measureDivisor;
                }
            }
        } else {
            return parseInt(value);
        }
    }

    private shiftPosition(value: string, amount: number, direction: -1 | 1 = 1) {
        const shift = (n, m) => {
            const result = direction > 0 ? n + m : n - m;
            if (result > 8) {
                return result % 8;
            } else if (result < 1) {
                return result + 8;
            }
            return result;
        };

        if (isNaN(Number(value)) && value.length === 2 && !isNaN(Number(value.charAt(1)))) {
            const left = value.charAt(0);
            const right = value.charAt(1);
            return left + shift(Number(right), amount);
        } else if (!isNaN(Number(value))) {
            return shift(Number(value), amount);
        } else {
            return value;
        }
    }

    private isButtonPosition(item: string) {
        const position = Number(item);
        return !isNaN(position) && position >= 1 && position <= 8;
    }

    private isTouchPosition(item: string) {
        const left = item.charAt(0);
        const right = item.length > 1 ? item.charAt(1) : '';
        return (right.length === 0 && left === 'C') ||
            (['ABDE'].includes(left) && this.isButtonPosition(right));
    }

    private isDecorator(item: string) {
        const matches = item.match(/^([@$bfhx]{0,3})$/);
        return matches != null && matches.length > 0;
    }

    private isSlideNotation(item: string) {
        const matches = item.match(/^([-^<>Vpqsvwz]{0,2})$/);
        return matches != null && matches.length > 0;
    }

    private isEndPosition(item: string) {
        const matches = item.match(/^([1-8])$/);
        return matches != null && matches.length > 0;
    }

    private isLength(item: string) {
        const matches = item.match(/^(\[\d+[:|#]{1,2}\d+])$/);
        return matches != null && matches.length > 0;
    }

    private isNormalLength(item: string) {
        const matches = item.match(/^(\[\d+:\d+])$/);
        return matches != null && matches.length > 0;
    }

    private isBpmLength(item: string) {
        const matches = item.match(/^(\[\d+#\d+])$/);
        return matches != null && matches.length > 0;
    }

    private isFixedLength(item: string) {
        const matches = item.match(/^(\[\d+##\d+])$/);
        return matches != null && matches.length > 0;
    }

    private hasBreakDecorator(item: string | string[]) {
        return item.includes('b');
    }

    private hasHoldDecorator(item: string | string[]) {
        return item.includes('h');
    }

    private hasFireworkDecorator(item: string | string[]) {
        return item.includes('f');
    }

    private hasExDecorator(item: string | string[]) {
        return item.includes('x');
    }

    private hasForceStarDecorator(item: string | string[]) {
        return item.includes('$');
    }

    private hasForceRingDecorator(item: string | string[]) {
        return item.includes('@');
    }
}
