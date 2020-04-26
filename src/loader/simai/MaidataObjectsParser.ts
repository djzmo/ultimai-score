import Note from "../../data/music/object/Note";
import Bpm from "../../data/music/object/Bpm";
import SlideNote from "../../data/music/object/SlideNote";
import SlideType from "../../data/music/object/SlideType";
import TouchArea from "../../data/music/object/TouchArea";
import NoteType from "../../data/music/object/NoteType";
import HoldNote from "../../data/music/object/HoldNote";

export default class MaidataObjectsParser {
    private noteObjects: Note[];
    private bpmObjects: Bpm[];

    constructor(data: string, measureResolution: number, defaultBpm: number, defaultDivisor: number = 4) {
        this.bpmObjects = [];
        this.noteObjects = this.load(data, measureResolution, defaultBpm, defaultDivisor);
    }

    getNoteObjects() {
        return this.noteObjects;
    }

    getBpmObjects() {
        return this.bpmObjects;
    }

    getTimeSignatureObjects() {
        return [];
    }

    private load(data: string, measureResolution: number, defaultBpm: number, defaultDivisor: number) {
        this.noteObjects = [];
        this.bpmObjects = [];

        let items = data.split(',');
        items.forEach((value: string, index: number) => items[index] = value.trim());
        items = items.filter(v => v.length > 0);
        let bpm = defaultBpm;
        let restLength = measureResolution / defaultDivisor;
        let currentMeasure = 1, currentGrid = 0;
        for (let item of items) {
            const newBpm = this.parseBpm(item);
            if (newBpm != null) {
                item = this.trimBpm(item);
                bpm = newBpm;
                this.bpmObjects.push({bpm, measure: currentMeasure, grid: currentGrid});
            }

            const divisor = this.parseDivisor(item, measureResolution, bpm);
            if (divisor != null) {
                const newRestLength = this.toGridLength(divisor, measureResolution, bpm);
                if (!isNaN(Number(newRestLength))) {
                    restLength = newRestLength;
                }
                item = this.trimDivisor(item);
            }

            const noteObjects = this.parseEach(item, currentMeasure, currentGrid, measureResolution, bpm);
            if (noteObjects != null) {
                this.noteObjects.push(...noteObjects);
            }

            currentGrid += restLength;
            if (currentGrid >= measureResolution) {
                currentGrid %= measureResolution;
                currentMeasure++;
            }
        }
        return this.noteObjects;
    }

    // [<length>] -> <length>
    private parseLength(item: string): string | null {
        const matches = item.match(/\[(\d+|#\d+\.?\d*|\d+\.?\d*(?:#{1,2})\d+\.?\d*|\d+\.?\d*(?::)\d+\.?\d*)]/);
        if (matches != null && matches.length > 0) {
            return matches[1];
        }
        return null;
    }

    // {<divisor>} -> <divisor>
    private parseDivisor(item: string, measureResolution: number, bpm: number): string | null {
        const matches = item.match(/{(\d+|#\d+\.?\d*|\d+\.?\d*(?:#{1,2})\d+\.?\d*)}/);
        if (matches != null && matches.length > 0) {
            return matches[1];
        }
        return null;
    }

    // {8}1 -> 1
    private trimDivisor(item: string): string {
        return item.replace(/{(\d+|#\d+\.?\d*)}/g, '');
    }

    // (120)1 -> 120
    private parseBpm(item: string): number | null {
        const matches = item.match(/\((\d+\.?\d*)\)/);
        if (matches != null && matches.length > 0) {
            const value = parseFloat(matches[1]);
            if (!isNaN(value)) {
                return value;
            } else {
                throw new Error(`Invalid BPM value in ${item}`);
            }
        }
        return null;
    }

    // (120)1 -> 1
    private trimBpm(item: string): string {
        return item.replace(/\((\d+\.?\d*)\)/g, '');
    }

    private parseEach(item: string,
                      measure: number,
                      grid: number,
                      measureResolution: number,
                      bpm: number): Note[] {
        let eachNotes: Note[] = [];
        // 12345678
        if (item.length >= 2 && item.length <= 8 && !isNaN(Number(item))) {
            const matches = item.match(/([1-8])/g);
            if (matches != null && matches.length > 0) {
                for (const match of matches) {
                    const producedNotes = this.parseSingle(match, measure, grid, measureResolution, bpm);
                    if (producedNotes != null) {
                        eachNotes.push(...producedNotes);
                    }
                }
            }
        // 1/2/3/4 | 1`2`3`4
        } else {
            const matches = item.match(/(?:[\/`])?([a-zA-Z0-9\[\]:.^<>*?!\-@$#`]+)/g);
            if (matches != null && matches.length > 0) {
                let pseudoIndex = 0;
                for (const match of matches) {
                    const isPseudo = match.charAt(0) === '`';
                    const isMultiple = match.charAt(0) === '/' || isPseudo;
                    const producedNotes = this.parseMultiple(isMultiple ? match.substring(1) : match,
                        measure,
                        grid,
                        measureResolution,
                        bpm,
                        pseudoIndex++);
                    if (producedNotes != null && producedNotes.length > 0) {
                        eachNotes.push(...producedNotes);
                    }
                }
            }
        }
        return eachNotes;
    }

    private parseMultiple(item: string,
                          measure: number,
                          grid: number,
                          measureResolution: number,
                          bpm: number,
                          pseudoIndex: number = 0): Note[] {
        const matches = item.match(/(?:\*!?)?([a-zA-Z0-9\[\]:.^<>?!\-@$#`]+)/g);
        const notes: Note[] = [];
        if (matches != null && matches.length > 0) {
            let startPosition = Number(matches[0].charAt(0));
            if (isNaN(startPosition)) {
                throw new Error(`Start of a sequence must be of a button position: ${item}`);
            }
            let lastEndPosition = -1;
            for (const match of matches) {
                const isMultipleEnding = match.charAt(0) === '*'; // 1-4[4:1]*-7[4:1]*-2[4:1]
                const isSequenceWithStar = match.charAt(0) === '?'; // 1-4[4:1]?-7[4:1]?-2[4:1]
                const isSequenceWithoutStar = match.charAt(0) === '!'; // 1-4[4:1]!-7[4:1]!-2[4:1]
                const isSequence = isMultipleEnding || isSequenceWithStar || isSequenceWithoutStar;
                const producedNotes = this.parseSingle(isSequence ? startPosition.toString() + match.substring(1) : match,
                    measure,
                    grid + pseudoIndex,
                    measureResolution,
                    bpm,
                    isSequence ? match.charAt(0) : undefined);
                if (producedNotes != null) {
                    for (const i in producedNotes) {
                        const note = producedNotes[i];
                        if (note.type === NoteType.SLIDE) {
                            const slideNote = <SlideNote> producedNotes[i];
                            if (isSequenceWithStar || isSequenceWithoutStar) {
                                slideNote.position = lastEndPosition;
                            }
                            lastEndPosition = slideNote.endPosition;
                        }
                    }
                    notes.push(...producedNotes);
                }
            }
        }
        return notes;
    }

    private parseSingle(item: string,
                        measure: number,
                        grid: number,
                        measureResolution: number,
                        bpm: number,
                        sequenceType?: string): Note[] {
        const matches = item.match(/^([1-8]|[ABDE][1-8]|C)([@$bfhx]{0,3})?([-^<>Vpqsvwz]{0,2})?([1-8]{1,2})?(\[\d+[:|#]{1,2}\d+])?/);
        if (matches != null && matches.length > 0) {
            const startPosition = matches[1];
            const decoratorOrSlideNotationOrLength = matches[2];
            const slideNotationOrEndPositionOrLength = matches[3];
            const endPositionOrLength = matches[4];
            const possiblyLength = matches[5];
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
                } else if (!this.isButtonPosition(startPosition) && startPosition !== 'C') {
                    throw new Error(`Illegal start position for hold: ${item}`);
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
            if (endPosition != null && endPosition.length === 2) {
                if (slideNotation !== 'V') {
                    throw new Error(`Illegal end position for slide type: ${item}`);
                } else {
                    const tagPosition = endPosition.charAt(0);
                    const nStartPosition = Number(startPosition);
                    if (this.shiftPosition(tagPosition, 2, -1) !== nStartPosition &&
                        this.shiftPosition(tagPosition, 2, 1) !== nStartPosition) {
                        throw new Error(`Tag position for tag slide may only shift by 2: ${item}`);
                    }
                }
            }

            // Construct
            if (slideNotation != null) {
                const durationMap = this.convertWaitTravelMapToGridLength(length, measureResolution, bpm);
                let waitDuration = measureResolution / 4, travelDuration; // wait duration is always one beat by default
                if (durationMap != null) {
                    waitDuration = durationMap.waitDuration;
                    travelDuration = durationMap.travelDuration;
                } else {
                    travelDuration = this.toGridLength(length, measureResolution, bpm);
                }
                const nStartPosition = Number(startPosition);
                let slideType = this.toSlideType(slideNotation);
                if (slideNotation === 'V') {
                    const tagPosition = endPosition?.charAt(0);
                    slideType = this.shiftPosition(tagPosition, 2, -1) === nStartPosition ? SlideType.L_TAG_L : SlideType.L_TAG_R;
                    endPosition = endPosition?.charAt(1);
                }
                const nEndPosition = Number(endPosition);

                const notes: Note[] = [];

                if (sequenceType == null || sequenceType === '?') {
                    const starType = this.hasBreakDecorator(decorators) ? NoteType.BREAK_STAR :
                        (this.hasExDecorator(decorators) ? NoteType.EX_STAR : NoteType.STAR);
                    const ringType = this.hasBreakDecorator(decorators) ? NoteType.BREAK :
                        (this.hasExDecorator(decorators) ? NoteType.EX_TAP : NoteType.TAP);
                    notes.push({
                        grid,
                        measure,
                        position: nStartPosition,
                        area: TouchArea.A,
                        type: this.hasForceRingDecorator(decorators) ? ringType : starType
                    });
                }

                notes.push(<Note>{
                    grid,
                    measure,
                    position: nStartPosition,
                    area: TouchArea.A,
                    type: NoteType.SLIDE,
                    slideType,
                    endPosition: nEndPosition,
                    waitDuration,
                    travelDuration
                });

                return notes;
            } else if (this.hasHoldDecorator(decorators)) {
                const position = this.isButtonPosition(startPosition) ? Number(startPosition) :
                    startPosition === 'C' ? undefined : Number(startPosition.charAt(1));
                const area = this.toTouchArea(startPosition);
                const note: HoldNote = {
                    grid,
                    measure,
                    position,
                    area,
                    type: startPosition === 'C' ? NoteType.TOUCH_HOLD :
                        (this.hasExDecorator(decorators) ? NoteType.EX_HOLD : NoteType.HOLD)
                };

                if (length != null) {
                    const parsedLength = this.parseLength(length);
                    if (parsedLength != null) {
                        note.holdLength = this.toGridLength(parsedLength, measureResolution, bpm);
                    } else {
                        throw new Error(`Unable to parse hold length: ${length}`);
                    }
                }

                return [<Note>note];
            } else {
                const position = this.isButtonPosition(startPosition) ? Number(startPosition) :
                    startPosition === 'C' ? undefined : Number(startPosition.charAt(1));
                const area = this.toTouchArea(startPosition);
                const starType = (this.hasBreakDecorator(decorators) ? NoteType.BREAK_STAR :
                    (this.hasExDecorator(decorators) ? NoteType.EX_STAR : NoteType.STAR));
                const ringType = (this.hasBreakDecorator(decorators) ? NoteType.BREAK :
                    (this.hasExDecorator(decorators) ? NoteType.EX_TAP : NoteType.TAP));
                const note: Note = {
                    grid,
                    measure,
                    position,
                    area,
                    type: this.isTouchPosition(startPosition) ? NoteType.TOUCH_TAP :
                        this.hasForceStarDecorator(decorators) ? starType : ringType
                };

                return [note];
            }
        }
        return [];
    }

    // <waitDuration>##<travelDuration> -> {waitDurationGridLength, travelDurationGridLength}
    private convertWaitTravelMapToGridLength(value: string, measureResolution: number, defaultBpm: number) {
        if (value.indexOf('##') > 0) {
            const splitValue = value.split('##');
            const waitDuration = parseFloat(splitValue[0]);
            const travelDuration = parseFloat(splitValue[1]);
            if (!isNaN(waitDuration) && !isNaN(travelDuration)) {
                return {
                    waitDuration: this.convertSecondsToGridLength(waitDuration, measureResolution, defaultBpm),
                    travelDuration: this.convertSecondsToGridLength(travelDuration, measureResolution, defaultBpm)
                };
            }
        }
        return null;
    }

    // (<divisor> | <divisor>:<length> | #<ravelDuration> | <bpm>#<travelDuration>) -> <restLength>
    private toGridLength(value: string, measureResolution: number, defaultBpm: number) {
        let bpm = defaultBpm;
        // #<travelDuration> | <bpm>#<travelDuration>
        if (value.indexOf('#') !== -1) {
            let rawDuration;
            if (value.indexOf('#') > 0) {
                bpm = parseFloat(value.substring(0, value.indexOf('#')));
                rawDuration = value.substring(value.indexOf('#') + 1);
                if (isNaN(bpm)) {
                    throw new Error(`Invalid value during conversion: ${value}`);
                }
            } else {
                rawDuration = value.substring(1);
            }
            const secondsDuration = parseFloat(rawDuration);
            if (isNaN(secondsDuration)) {
                throw new Error(`Invalid duration during conversion: ${value}`);
            }
            return this.convertSecondsToGridLength(secondsDuration, measureResolution, bpm);
        // <divisor>:<length>
        } else if (value.indexOf(':') !== -1) {
            if (value.indexOf(':') > 0) {
                const splitValue = value.split(':');
                const divisor = parseFloat(splitValue[0]);
                const length = parseFloat(splitValue[1]);
                if (!isNaN(divisor) && !isNaN(length)) {
                    return this.convertBracketsLengthToGridLength(divisor, length, measureResolution);
                }
            }
            throw new Error(`Conversion failed due to invalid length: ${value}`);
        } else {
            const divisor = parseInt(value);
            if (!isNaN(divisor)) {
                return 1 / divisor * measureResolution;
            }
        }
        throw new Error(`Conversion failed due to unrecognized length format: ${value}`);
    }

    // <slideNotation> -> <slideType>
    // '-' -> SlideType.STRAIGHT
    private toSlideType(value: string) {
        switch (value) {
            case '-':
                return SlideType.STRAIGHT;
            case '<':
                return SlideType.CURVE_L;
            case '>':
                return SlideType.CURVE_R;
            case 'p':
                return SlideType.CENTER_ROTATION_LEFT;
            case 'q':
                return SlideType.CENTER_ROTATION_RIGHT;
            case 's':
                return SlideType.LETTER_S_LEFT;
            case 'z':
                return SlideType.LETTER_S_RIGHT;
            case 'v':
                return SlideType.LETTER_V;
            case 'pp':
                return SlideType.SIDE_ROTATION_L;
            case 'qq':
                return SlideType.SIDE_ROTATION_R;
            case 'V': // case 'V' should be further handled to decide L/R
                return SlideType.L_TAG_L;
            case 'w':
                return SlideType.FAN;
        }
        throw new Error(`Unknown slide notation: ${value}`);
    }

    private toTouchArea(value: string) {
        if (this.isButtonPosition(value)) {
            return TouchArea.A;
        } else if (value.charAt(0) === 'B') {
            return TouchArea.B;
        } else if (value.charAt(0) === 'C') {
            return TouchArea.C;
        } else if (value.charAt(0) === 'D') {
            return TouchArea.D;
        } else if (value.charAt(0) === 'E') {
            return TouchArea.E;
        } else {
            throw new Error(`Unknown position: ${value}`);
        }
    }

    private convertSecondsToGridLength(value: number, measureResolution: number, bpm: number) {
        // f(x) = x / secondsPerBeat / beatsPerMeasure * measureResolution
        const spb = 1 / bpm / 60;
        return value / spb / 4 * measureResolution;
    }

    private convertDivisorToGridLength(value: number, measureResolution: number) {
        return measureResolution / value;
    }

    private convertBracketsLengthToGridLength(divisor: number, length: number, measureResolution: number) {
        return length / divisor * measureResolution;
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
        if (item == null) {
            return false;
        }
        const matches = item.match(/^([@$bfhx]{0,3})$/);
        return matches != null && matches.length > 0;
    }

    private isSlideNotation(item: string) {
        if (item == null) {
            return false;
        }
        const matches = item.match(/^([-^<>Vpqsvwz]{0,2})$/);
        return matches != null && matches.length > 0;
    }

    private isEndPosition(item: string) {
        if (item == null) {
            return false;
        }
        const matches = item.match(/^([1-8])$/);
        return matches != null && matches.length > 0;
    }

    private isLength(item: string) {
        if (item == null) {
            return false;
        }
        const matches = item.match(/^(\[\d+[:|#]{1,2}\d+])$/);
        return matches != null && matches.length > 0;
    }

    private isNormalLength(item: string) {
        if (item == null) {
            return false;
        }
        const matches = item.match(/^(\[\d+:\d+])$/);
        return matches != null && matches.length > 0;
    }

    private isBpmLength(item: string) {
        if (item == null) {
            return false;
        }
        const matches = item.match(/^(\[\d+#\d+])$/);
        return matches != null && matches.length > 0;
    }

    private isFixedLength(item: string) {
        if (item == null) {
            return false;
        }
        const matches = item.match(/^(\[\d+##\d+])$/);
        return matches != null && matches.length > 0;
    }

    private hasBreakDecorator(item: string | string[]) {
        if (item == null) {
            return false;
        }
        return item.includes('b');
    }

    private hasHoldDecorator(item: string | string[]) {
        if (item == null) {
            return false;
        }
        return item.includes('h');
    }

    private hasFireworkDecorator(item: string | string[]) {
        if (item == null) {
            return false;
        }
        return item.includes('f');
    }

    private hasExDecorator(item: string | string[]) {
        if (item == null) {
            return false;
        }
        return item.includes('x');
    }

    private hasForceStarDecorator(item: string | string[]) {
        if (item == null) {
            return false;
        }
        return item.includes('$');
    }

    private hasForceRingDecorator(item: string | string[]) {
        if (item == null) {
            return false;
        }
        return item.includes('@');
    }
}
