import isNumber from 'is-number';
import Note from "../../data/music/object/Note";
import Bpm from "../../data/music/object/Bpm";
import SlideType from "../../data/music/object/SlideType";
import TouchArea from "../../data/music/object/TouchArea";
import NoteType from "../../data/music/object/NoteType";
import HoldNote from "../../data/music/object/HoldNote";
import TimeSignature from "../../data/music/object/TimeSignature";
import MusicStatistics from "../../data/music/MusicStatistics";
import {calculateDistance, isButtonPosition, isTouchPosition, shiftPosition} from "../../util/NoteUtil";

type SimaiMaidataObjectsParseResult = {
    noteObjects: Note[],
    bpmObjects: Bpm[],
    timeSignatureObjects: TimeSignature[],
    statistics: MusicStatistics
};

export default class ObjectsParser {
    private static PSEUDO_EACH_LENGTH = 4;

    async parse(data: string, measureResolution: number, defaultBpm: number, defaultDivisor: number = 4) : Promise<SimaiMaidataObjectsParseResult> {
        const noteObjects: Note[] = [];
        const bpmObjects: Bpm[] = [];
        const timeSignatureObjects: TimeSignature[] = [{divisor: 4, beatLength: 4, grid: 0, measure: 0}];
        const statistics: MusicStatistics = new MusicStatistics;

        let items = data.split(',');
        items.forEach((value: string, index: number) => items[index] = value.trim());
        let bpm = defaultBpm;
        let restLength = measureResolution / defaultDivisor;
        let currentMeasure = 1, currentGrid = 0;
        for (let item of items) {
            const newBpm = this.parseBpm(item);
            if (newBpm) {
                item = this.trimBpm(item);
                bpm = newBpm;
                bpmObjects.push({bpm, measure: currentMeasure, grid: currentGrid});
            }

            const divisor = this.parseDivisor(item, measureResolution, bpm);
            if (divisor) {
                const newRestLength = this.toGridLength(divisor, measureResolution, bpm);
                if (isNumber(newRestLength)) {
                    restLength = newRestLength;
                }
                item = this.trimDivisor(item);
            }

            const noteObjects = this.parseEach(item, currentMeasure, currentGrid, measureResolution, bpm, statistics);
            if (noteObjects && noteObjects.length > 0) {
                noteObjects.push(...noteObjects);
            }

            currentGrid += restLength;
            if (currentGrid >= measureResolution) {
                currentGrid %= measureResolution;
                currentMeasure++;
            }
        }

        statistics?.calculateTotals();
        return {noteObjects, bpmObjects, timeSignatureObjects, statistics};
    }

    // [<length>] -> <length>
    private parseLength(item: string): string | undefined {
        const matches = item.match(/\[(#\d+\.?\d*|\d+\.?\d*(?:#{1,2})\d+\.?\d*|\d+\.?\d*(?::)\d+\.?\d*|\d+\.?\d*)]/);
        if (matches && matches.length > 0) {
            return matches[1];
        }
        return undefined;
    }

    // {<divisor>} -> <divisor>
    private parseDivisor(item: string, measureResolution: number, bpm: number): string | undefined {
        const matches = item.match(/{(.*?)}/);
        if (matches && matches.length > 0) {
            return matches[1];
        }
        return undefined;
    }

    // {8}1 -> 1
    private trimDivisor(item: string): string {
        return item.replace(/{(.*?)}/g, '');
    }

    // (120)1 -> 120
    private parseBpm(item: string): number | undefined {
        const matches = item.match(/\((.*?)\)/);
        if (matches && matches.length > 0) {
            const value = Number(matches[1]);
            if (isNumber(value)) {
                return value;
            } else {
                throw new Error(`Invalid BPM value: ${matches[1]}`);
            }
        }
        return undefined;
    }

    // (120)1 -> 1
    private trimBpm(item: string): string {
        return item.replace(/\((\d+\.?\d*)\)/g, '');
    }

    // 12345678 | 1/2/3/4 | 1`2`3`4
    private parseEach(item: string,
                      measure: number,
                      grid: number,
                      measureResolution: number,
                      bpm: number,
                      statistics: MusicStatistics): Note[] {
        let eachNotes: Note[] = [];
        // 12345678
        if (item.length >= 2 && item.length <= 8 && isNumber(item)) {
            const matches = item.match(/([1-8])/g);
            if (matches && matches.length > 0) {
                for (const match of matches) {
                    const producedNotes = this.parseSingle(match, measure, grid, measureResolution, bpm, statistics);
                    if (producedNotes) {
                        eachNotes.push(...producedNotes);
                    }
                }
            }
        // 1/2/3/4 | 1`2`3`4
        } else {
            const matches = item.match(/(?:[`\/])?([a-zA-Z0-9\[\]:.^<>*?!\-@$#]+)/g);
            if (matches && matches.length > 0) {
                // Preprocess sequence with each notation
                // 3V15[2:1]/3*v5[2:1] | 3V15[2:1]/*3v5[2:1] -> 3V15[2:1]*v5[2:1]
                if (matches.length > 1) {
                    let lastStartPosition = matches[0].charAt(0);
                    for (let i = 1; i < matches.length; i++) {
                        const match = matches[i];
                        if (match.charAt(0) === '/' && match.indexOf('*') !== -1) {
                            const currentStartPosition = match.charAt(1) === '*' ? matches[i].charAt(2) : matches[i].charAt(1);
                            if (lastStartPosition === currentStartPosition) {
                                const suffix = '*' + match.substring(3);
                                matches[0] = matches[0].concat(suffix);
                                matches.splice(i, 1);
                                i--;
                            }
                        }
                    }
                }
                
                let pseudoIndex = 0;
                for (const match of matches) {
                    const isPseudo = match.charAt(0) === '`';
                    const isMultiple = match.charAt(0) === '/' || isPseudo;
                    const producedNotes = this.parseMultiple(isMultiple ? match.substring(1) : match,
                        measure,
                        grid,
                        measureResolution,
                        bpm,
                        statistics,
                        isPseudo ? ++pseudoIndex : 0);
                    if (producedNotes && producedNotes.length > 0) {
                        eachNotes.push(...producedNotes);
                    }
                }
            }
        }
        return eachNotes;
    }

    // 1-4[4:1]*-7[4:1]*-3[4:1]
    private parseMultiple(item: string,
                          measure: number,
                          grid: number,
                          measureResolution: number,
                          bpm: number,
                          statistics: MusicStatistics,
                          pseudoIndex: number = 0): Note[] {
        const matches = item.match(/(?:\*)?([a-zA-Z0-9\[\]:.^<>?!\-@$#`]+)/g);
        const notes: Note[] = [];
        if (matches && matches.length > 0) {
            if (isTouchPosition(matches[0])) {
                const producedNotes = this.parseSingle(matches[0],
                    measure,
                    grid + pseudoIndex * ObjectsParser.PSEUDO_EACH_LENGTH,
                    measureResolution,
                    bpm,
                    statistics);
                notes.push(...producedNotes);
            } else {
                let startPosition = matches[0].charAt(0);
                for (const match of matches) {
                    const isHeadless = match.charAt(0) === '*'; // 1-4[4:1]*-7[4:1]*-2[4:1]
                    const producedNotes = this.parseSingle(isHeadless ? startPosition.toString() + match.substring(1) : match,
                        measure,
                        grid + pseudoIndex * ObjectsParser.PSEUDO_EACH_LENGTH,
                        measureResolution,
                        bpm,
                        statistics,
                        isHeadless);
                    if (producedNotes && producedNotes.length > 0) {
                        notes.push(...producedNotes);
                    }
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
                        statistics: MusicStatistics,
                        isHeadless?: boolean): Note[] {
        const matches = item.match(/^([1-8]|[ABDE][1-8]|C)([@$bfhx!?]{0,3})?([-^<>Vpqsvwz]{0,2})?([1-8]{1,2})?(\[#\d+\.?\d*]|\[\d+\.?\d*(?:#{1,2})\d+\.?\d*]|\[\d+\.?\d*:\d+\.?\d*]|\[\d+\.?\d*])?/);
        if (matches && matches.length > 0) {
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
            if (!isButtonPosition(startPosition) && !isTouchPosition(startPosition)) {
                throw new Error(`Invalid start position: ${item}`);
            }
            if (slideNotation && !endPosition) {
                throw new Error(`Missing end position for slide: ${item}`);
            }
            if (endPosition && !slideNotation) {
                throw new Error(`Missing mandatory slide notation for slide: ${item}`);
            }
            if (!slideNotation && (this.hasNoStarDecorator(decorators) || this.hasSuddenStarDecorator(decorators))) {
                throw new Error(`Illegal star decorator for types other than slide: ${item}`);
            }
            if (slideNotation && endPosition && !length) {
                throw new Error(`Missing length for slide: ${item}`);
            }
            if (slideNotation && endPosition && isTouchPosition(endPosition)) {
                throw new Error(`Illegal end position for slide: ${item}`);
            }
            if (slideNotation && isTouchPosition(startPosition)) {
                throw new Error(`Illegal start position for slide: ${item}`);
            }
            if (slideNotation) {
                if (isNumber(startPosition) && isNumber(endPosition)) {
                    const nStartPosition = Number(startPosition);
                    const nEndPosition = Number(endPosition);
                    if (nStartPosition === nEndPosition && (slideNotation === '-' || slideNotation === '^' || slideNotation === 'v' ||
                        slideNotation === 'V' || slideNotation === 's' || slideNotation === 'z' || slideNotation === 'w')) {
                        throw new Error(`Illegal end position for slide type: ${item}`);
                    } else if (slideNotation === '^' && Math.abs(calculateDistance(nStartPosition, nEndPosition)) === 4) {
                        throw new Error(`Illegal start-end distance for '^' slide: ${item}`);
                    } else if ('wsz'.includes(slideNotation) && Math.abs(calculateDistance(nStartPosition, nEndPosition)) !== 4) {
                        throw new Error(`Illegal start-end distance for 's'/'w'/'z' slide: ${item}`);
                    }
                }
            }
            if (this.hasHoldDecorator(decorators)) {
                if (endPosition) {
                    throw new Error(`Illegal end position for hold: ${item}`);
                } else if (this.hasBreakDecorator(decorators)) {
                    throw new Error(`Illegal break decorator for hold: ${item}`);
                } else if (this.hasForceRingDecorator(decorators) || this.hasForceStarDecorator(decorators)) {
                    throw new Error(`Illegal force decorator for hold: ${item}`);
                } else if (!isButtonPosition(startPosition) && startPosition !== 'C') {
                    throw new Error(`Illegal start position for hold: ${item}`);
                } else if (length && length.indexOf('#') !== -1) {
                    throw new Error(`Illegal hash length for hold: ${item}`);
                } else if (this.hasNoStarDecorator(decorators) || this.hasSuddenStarDecorator(decorators)) {
                    throw new Error(`Illegal star decorator for hold: ${item}`);
                }
            }
            if (this.hasFireworkDecorator(decorators)) {
                if (startPosition !== 'C') {
                    throw new Error(`Illegal position for firework decorator: ${item}`);
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
                    throw new Error(`EX decorator cannot be used at the same time with break decorator: ${item}`);
                } else if (isTouchPosition(decorators)) {
                    throw new Error(`Invalid start position for break decorator: ${item}`);
                } else if (this.hasNoStarDecorator(decorators) || this.hasSuddenStarDecorator(decorators)) {
                    throw new Error(`Star decorator cannot be used at the same time with break decorator: ${item}`);
                }
            }
            if (endPosition && endPosition.length === 2) {
                if (slideNotation !== 'V') {
                    throw new Error(`Illegal end position for slide type: ${item}`);
                } else {
                    const refractPosition = endPosition.charAt(0);
                    const nStartPosition = Number(startPosition);
                    if (shiftPosition(refractPosition, 2, -1) !== nStartPosition &&
                        shiftPosition(refractPosition, 2, 1) !== nStartPosition) {
                        throw new Error(`Refract position for refractive slide must only be two steps away: ${item}`);
                    }
                }
            }

            // Construct
            if (slideNotation) {
                const parsedLength = this.parseLength(length);
                if (!parsedLength) {
                    throw new Error(`Invalid length format: ${length}`);
                }
                const durationMap = this.convertWaitTravelMapToGridLength(parsedLength, measureResolution, bpm);
                let waitDuration = measureResolution / 4, travelDuration; // wait duration is always one beat by default
                if (durationMap) {
                    waitDuration = durationMap.waitDuration;
                    travelDuration = durationMap.travelDuration;
                } else {
                    travelDuration = this.toGridLength(parsedLength, measureResolution, bpm);
                }

                const nStartPosition = Number(startPosition);
                let slideType = this.toSlideType(slideNotation);
                if (slideNotation === 'V') {
                    const refractPosition = endPosition?.charAt(0);
                    slideType = shiftPosition(startPosition, 2, -1) === Number(refractPosition) ? SlideType.REFRACTIVE_L : SlideType.REFRACTIVE_R;
                    endPosition = endPosition?.charAt(1);
                } else if (slideNotation === '^') {
                    const nEndPosition = Number(endPosition);
                    const distance = calculateDistance(nStartPosition, nEndPosition);
                    slideType = shiftPosition(startPosition, distance, -1) === nEndPosition ? SlideType.CURVE_L : SlideType.CURVE_R;
                }

                const notes: Note[] = [];
                if (!this.hasNoStarDecorator(decorators) && !isHeadless) {
                    const starType = this.hasBreakDecorator(decorators) ? NoteType.BREAK_STAR :
                        (this.hasExDecorator(decorators) ? NoteType.EX_STAR : NoteType.STAR);
                    const ringType = this.hasBreakDecorator(decorators) ? NoteType.BREAK :
                        (this.hasExDecorator(decorators) ? NoteType.EX_TAP : NoteType.TAP);
                    const starNote = {
                        grid,
                        measure,
                        position: nStartPosition,
                        area: TouchArea.A,
                        type: this.hasForceRingDecorator(decorators) ? ringType : starType
                    };
                    statistics.increment(starNote.type);
                    notes.push(starNote);
                }

                const slideNote = {
                    grid,
                    measure,
                    position: nStartPosition,
                    area: TouchArea.A,
                    type: NoteType.SLIDE,
                    slideType,
                    endPosition: Number(endPosition),
                    waitDuration,
                    travelDuration
                };

                statistics.increment(slideNote.type);
                notes.push(<Note>slideNote);
                return notes;
            } else if (this.hasHoldDecorator(decorators)) {
                const position = isButtonPosition(startPosition) ? Number(startPosition) :
                    startPosition === 'C' ? undefined : Number(startPosition.charAt(1));
                const area = this.toTouchArea(startPosition);
                const firework = this.hasFireworkDecorator(decorators);
                const note: HoldNote = {
                    grid,
                    measure,
                    position,
                    area,
                    firework: startPosition === 'C' ? firework : undefined,
                    type: startPosition === 'C' ? NoteType.TOUCH_HOLD :
                        (this.hasExDecorator(decorators) ? NoteType.EX_HOLD : NoteType.HOLD)
                };

                if (length) {
                    const parsedLength = this.parseLength(length);
                    if (parsedLength) {
                        note.holdLength = this.toGridLength(parsedLength, measureResolution, bpm);
                    } else {
                        throw new Error(`Unable to parse hold length: ${length}`);
                    }
                }
                statistics.increment(note.type);
                return [<Note>note];
            } else {
                const position = isButtonPosition(startPosition) ? Number(startPosition) :
                    startPosition === 'C' ? undefined : Number(startPosition.charAt(1));
                const area = this.toTouchArea(startPosition);
                const starType = (this.hasBreakDecorator(decorators) ? NoteType.BREAK_STAR :
                    (this.hasExDecorator(decorators) ? NoteType.EX_STAR : NoteType.STAR));
                const ringType = (this.hasBreakDecorator(decorators) ? NoteType.BREAK :
                    (this.hasExDecorator(decorators) ? NoteType.EX_TAP : NoteType.TAP));
                const firework = this.hasFireworkDecorator(decorators);
                const note: Note = {
                    grid,
                    measure,
                    position,
                    area,
                    firework: startPosition === 'C' ? firework : undefined,
                    type: isTouchPosition(startPosition) ? NoteType.TOUCH_TAP :
                        this.hasForceStarDecorator(decorators) ? starType : ringType
                };
                statistics.increment(note.type);
                return [note];
            }
        }
        throw new Error(`Unable to parse object: ${item}`);
    }

    // <waitDuration>##<travelDuration> -> {waitDurationGridLength, travelDurationGridLength}
    private convertWaitTravelMapToGridLength(value: string, measureResolution: number, defaultBpm: number) {
        if (value.indexOf('##') > 0) {
            const splitValue = value.split('##');
            const waitDuration = Number(splitValue[0]);
            const travelDuration = Number(splitValue[1]);
            if (isNumber(waitDuration) && isNumber(travelDuration)) {
                return {
                    waitDuration: this.convertSecondsToGridLength(waitDuration, measureResolution, defaultBpm),
                    travelDuration: this.convertSecondsToGridLength(travelDuration, measureResolution, defaultBpm)
                };
            }
        }
        return undefined;
    }

    // (<divisor> | <divisor>:<length> | #<travelDuration> | <bpm>#<travelDuration>) -> <restLength>
    private toGridLength(value: string, measureResolution: number, defaultBpm: number) {
        let bpm = defaultBpm;
        // #<travelDuration> | <bpm>#<travelDuration>
        if (value.indexOf('#') !== -1) {
            let rawDuration;
            if (value.indexOf('#') > 0) {
                bpm = Number(value.substring(0, value.indexOf('#')));
                rawDuration = value.substring(value.indexOf('#') + 1);
                if (!isNumber(bpm)) {
                    throw new Error(`Invalid BPM value: ${value}`);
                }
            } else {
                rawDuration = value.substring(1);
            }
            const secondsDuration = Number(rawDuration);
            if (!isNumber(secondsDuration)) {
                throw new Error(`Invalid seconds duration value: ${value}`);
            }
            return this.convertSecondsToGridLength(secondsDuration, measureResolution, bpm);
        // <divisor>:<length>
        } else if (value.indexOf(':') !== -1) {
            if (value.indexOf(':') > 0) {
                const splitValue = value.split(':');
                const divisor = Number(splitValue[0]);
                const length = Number(splitValue[1]);
                if (isNumber(divisor) && isNumber(length)) {
                    return this.convertBracketsLengthToGridLength(divisor, length, measureResolution);
                }
            }
            throw new Error(`Invalid length: ${value}`);
        } else if (isNumber(value)) {
            const divisor = Number(value);
            return 1 / divisor * measureResolution;
        }
        throw new Error(`Unrecognized length format: ${value}`);
    }

    // <slideNotation> -> <slideType>
    // '-' -> SlideType.STRAIGHT
    private toSlideType(value: string) {
        switch (value) {
            case '-':
                return SlideType.STRAIGHT;
            case '^': // case '^' should be further handled to decide L/R
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
                return SlideType.REFRACTIVE_L;
            case 'w':
                return SlideType.FAN;
        }
        throw new Error(`Unknown slide notation: ${value}`);
    }

    private toTouchArea(value: string) {
        if (isButtonPosition(value)) {
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
        const bps = bpm / 60;
        const spb = 1 / bps;
        return value / spb / 4 * measureResolution;
    }

    private convertDivisorToGridLength(value: number, measureResolution: number) {
        return measureResolution / value;
    }

    private convertBracketsLengthToGridLength(divisor: number, length: number, measureResolution: number) {
        return length / divisor * measureResolution;
    }

    private isDecorator(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^([@$bfhx!?]{0,3})$/);
        return matches && matches.length > 0;
    }

    private isSlideNotation(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^([-^<>Vpqsvwz]{0,2})$/);
        return matches && matches.length > 0;
    }

    private isEndPosition(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^([1-8]{1,2})$/);
        return matches && matches.length > 0;
    }

    private isLength(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^(\[#\d+\.?\d*]|\[\d+\.?\d*(?:#{1,2})\d+\.?\d*]|\[\d+\.?\d*:\d+\.?\d*]|\[\d+\.?\d*])$/);
        return matches && matches.length > 0;
    }

    private isNormalLength(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^(\[\d+\.?\d*:\d+\.?\d*])$/);
        return matches && matches.length > 0;
    }

    private isBpmLength(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^(\[\d+\.?\d*#\d+\.?\d*])$/);
        return matches && matches.length > 0;
    }

    private isSecondsLength(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^(\[#\d+\.?\d*])$/);
        return matches && matches.length > 0;
    }

    private isFixedLength(item: string) {
        if (!item) {
            return false;
        }
        const matches = item.match(/^(\[\d+\.?\d*##\d+\.?\d*])$/);
        return matches && matches.length > 0;
    }

    private hasBreakDecorator(item: string | string[]) {
        if (!item) {
            return false;
        }
        return item.includes('b');
    }

    private hasHoldDecorator(item: string | string[]) {
        if (!item) {
            return false;
        }
        return item.includes('h');
    }

    private hasFireworkDecorator(item: string | string[]) {
        if (!item) {
            return false;
        }
        return item.includes('f');
    }

    private hasExDecorator(item: string | string[]) {
        if (!item) {
            return false;
        }
        return item.includes('x');
    }

    private hasForceStarDecorator(item: string | string[]) {
        if (!item) {
            return false;
        }
        return item.includes('$');
    }

    private hasForceRingDecorator(item: string | string[]) {
        if (!item) {
            return false;
        }
        return item.includes('@');
    }

    private hasNoStarDecorator(item: string | string[]) {
        if (!item) {
            return false;
        }
        return item.includes('?');
    }

    private hasSuddenStarDecorator(item: string | string[]) { // TODO
        if (!item) {
            return false;
        }
        return item.includes('!');
    }
}
