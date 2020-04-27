import isNumber from 'is-number';
import Note from '../../data/music/object/Note';
import Bpm from '../../data/music/object/Bpm';
import TimeSignature from '../../data/music/object/TimeSignature';
import MusicStatistics from '../../data/music/MusicStatistics';
import NoteType from '../../data/music/object/NoteType';
import TouchArea from '../../data/music/object/TouchArea';
import SlideNote from '../../data/music/object/SlideNote';
import HoldNote from '../../data/music/object/HoldNote';
import SlideType from "../../data/music/object/SlideType";

type Ma2ScoreParseResult = {
    noteObjects: Note[],
    bpmObjects: Bpm[],
    timeSignatureObjects: TimeSignature[],
    statistics: MusicStatistics,
    resolution: number
};

export default class ScoreParser {
    private static NOTE_COMMAND_MAP = {
        'TAP': NoteType.TAP,
        'HLD': NoteType.HOLD,
        'STR': NoteType.STAR,
        'BRK': NoteType.BREAK,
        'BST': NoteType.BREAK_STAR,
        'TTP': NoteType.TOUCH_TAP,
        'THO': NoteType.TOUCH_HOLD,
        'XTP': NoteType.EX_TAP,
        'XHO': NoteType.EX_HOLD,
        'XST': NoteType.EX_STAR
    };

    private static SLIDE_COMMAND_MAP = {
        'SI_': SlideType.STRAIGHT,
        'SCL': SlideType.CURVE_L,
        'SCR': SlideType.CURVE_R,
        'SUL': SlideType.CENTER_ROTATION_LEFT,
        'SUR': SlideType.CENTER_ROTATION_RIGHT,
        'SSL': SlideType.LETTER_S_LEFT,
        'SSR': SlideType.LETTER_S_RIGHT,
        'SV_': SlideType.LETTER_V,
        'SXL': SlideType.SIDE_ROTATION_L,
        'SXR': SlideType.SIDE_ROTATION_R,
        'SLL': SlideType.REFRACTIVE_L,
        'SLR': SlideType.REFRACTIVE_R,
        'SF_': SlideType.FAN
    };

    async parse(data: string) : Promise<Ma2ScoreParseResult> {
        const rows = data.split('\n');
        const headers: Record<string, string[]> = {};

        const noteObjects: Note[] = [];
        const bpmObjects: Bpm[] = [];
        const timeSignatureObjects: TimeSignature[] = [];
        const statistics = new MusicStatistics;

        for (const row of rows) {
            if (row.length === 0) {
                continue;
            }

            const args = row.trim().split('\t');
            const command = args[0];

            let type = ScoreParser.NOTE_COMMAND_MAP[command];
            if (type != null || (command.charAt(0) === 'S' && command.length === 3)) {
                const measure = Number(args[1]);
                const grid = Number(args[2]);
                const position = Number(args[3]);
                let argsIndex = 3;
                let holdLength, area, firework, size;
                let waitDuration, travelDuration, endPosition, slideType;

                if (!isNumber(measure) || !isNumber(grid) || !isNumber(position)) {
                    throw new Error(`Invalid note command: ${row}`);
                }

                if (type === NoteType.HOLD || type === NoteType.EX_HOLD || type === NoteType.TOUCH_HOLD) {
                    holdLength = Number(args[++argsIndex]);
                }

                slideType = ScoreParser.SLIDE_COMMAND_MAP[command];
                if (slideType != null) {
                    type = NoteType.SLIDE;
                    waitDuration = Number(args[++argsIndex]);
                    travelDuration = Number(args[++argsIndex]);
                    endPosition = Number(args[++argsIndex]);
                    area = TouchArea.A;
                } else if (type === NoteType.TOUCH_TAP || type === NoteType.TOUCH_HOLD) {
                    area = TouchArea[args[++argsIndex]];
                    firework = area === 'C' ? args[++argsIndex] === '1' : undefined;
                    size = args[++argsIndex];
                } else {
                    area = TouchArea.A;
                }

                // Construct
                if (type === NoteType.SLIDE) {
                    if (isNumber(waitDuration) && isNumber(travelDuration) && isNumber(endPosition) && slideType != null) {
                        const note: SlideNote = {
                            measure,
                            grid,
                            type,
                            position: position + 1,
                            area,
                            slideType,
                            waitDuration,
                            travelDuration,
                            endPosition
                        };

                        noteObjects.push(<Note>note);
                    } else {
                        throw new Error(`Invalid slide properties: ${row}`);
                    }
                } else if (type === NoteType.HOLD || type === NoteType.EX_HOLD || type === NoteType.TOUCH_HOLD) {
                    if (isNumber(holdLength)) {
                        const note: HoldNote = {
                            measure,
                            grid,
                            type,
                            position: area !== 'C' ? position + 1 : undefined,
                            area,
                            holdLength,
                            firework: area === 'C' ? firework : undefined
                        };

                        noteObjects.push(<Note>note);
                    } else {
                        throw new Error(`Invalid hold properties: ${row}`);
                    }
                } else {
                    const note: Note = {
                        measure,
                        grid,
                        type,
                        position: area !== 'C' ? position + 1 : undefined,
                        area,
                        firework: area === 'C' ? firework : undefined
                    };

                    noteObjects.push(note);
                }

                statistics.increment(type);
            } else if (command === 'BPM') {
                const measure = Number(args[1]);
                const grid = Number(args[2]);
                const bpm = Number(args[3]);

                if (!isNumber(measure) || !isNumber(grid) || !isNumber(bpm)) {
                    throw new Error(`Invalid ${command} command: ${row}`);
                }

                bpmObjects.push({measure, grid, bpm});
            } else if (command === 'MET') {
                const measure = Number(args[1]);
                const grid = Number(args[2]);
                const beatLength = Number(args[3]);
                const divisor = Number(args[4]);

                if (!isNumber(measure) || !isNumber(grid) || !isNumber(beatLength) || !isNumber(divisor)) {
                    throw new Error(`Invalid ${command} command: ${row}`);
                }

                timeSignatureObjects.push({measure, grid, beatLength, divisor});
            } else {
                headers[command] = args.slice(1);
            }
        }

        statistics.calculateTotals();

        const resolution = headers.RESOLUTION && isNumber(headers.RESOLUTION) ? Number(headers.RESOLUTION[0]) : 384;
        return {noteObjects, bpmObjects, timeSignatureObjects, statistics, resolution};
    }
}