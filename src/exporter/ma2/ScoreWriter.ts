import MusicNotesData from "../../data/music/MusicNotesData";
import NoteType from "../../data/music/object/NoteType";
import SlideNote from "../../data/music/object/SlideNote";
import HoldNote from "../../data/music/object/HoldNote";
import SlideType from "../../data/music/object/SlideType";

export default class ScoreWriter {
    private static MEASURE_RESOLUTION = 384;
    private static VERSION = '1.03.00';
    private static FES_MODE = '0';
    private static COMPATIBLE_CODE = 'MA2';
    private static DEFAULT_TOUCH_SIZE = 'M1';

    private static COMMAND_MAP = {
        [NoteType.TAP]: 'TAP',
        [NoteType.HOLD]: 'HLD',
        [NoteType.STAR]: 'STR',
        [NoteType.BREAK]: 'BRK',
        [NoteType.BREAK_STAR]: 'BST',
        [NoteType.SLIDE]: 'SLD',
        [NoteType.TOUCH_TAP]: 'TTP',
        [NoteType.TOUCH_HOLD]: 'THO',
        [NoteType.EX_TAP]: 'XTP',
        [NoteType.EX_HOLD]: 'XHO',
        [NoteType.EX_STAR]: 'XST'
    };

    private static SLIDE_COMMAND_MAP = {
        [SlideType.STRAIGHT]: 'SI_',
        [SlideType.CURVE_L]: 'SCL',
        [SlideType.CURVE_R]: 'SCR',
        [SlideType.CENTER_ROTATION_LEFT]: 'SUL',
        [SlideType.CENTER_ROTATION_RIGHT]: 'SUR',
        [SlideType.LETTER_S_LEFT]: 'SSL',
        [SlideType.LETTER_S_RIGHT]: 'SSR',
        [SlideType.LETTER_V]: 'SV_',
        [SlideType.SIDE_ROTATION_L]: 'SXL',
        [SlideType.SIDE_ROTATION_R]: 'SXR',
        [SlideType.REFRACTIVE_L]: 'SLL',
        [SlideType.REFRACTIVE_R]: 'SLR',
        [SlideType.FAN]: 'SF_'
    };

    private _output: string;

    constructor(notesData: MusicNotesData, defaultBpm: number) {
        this._output = this.build(notesData, defaultBpm);
    }

    get output(): string {
        return this._output;
    }

    private build(notesData: MusicNotesData, defaultBpm: number) {
        const output: string[] = [];
        const {noteObjects, bpmObjects, timeSignatureObjects} = notesData;
        const bpmDefs: string[] = [];

        if (bpmObjects && bpmObjects.length > 0) {
            for (const bpmObject of bpmObjects) {
                if (bpmDefs.length < 4) {
                    bpmDefs.push(bpmObject.bpm.toFixed(3).toString());
                } else {
                    break;
                }
            }

            if (bpmDefs.length === 2) {
                bpmDefs.push(bpmDefs[1]);
                bpmDefs.push(bpmDefs[0]);
            }
        }

        while (bpmDefs.length < 4) {
            bpmDefs.push(defaultBpm.toFixed(3).toString());
        }

        if (!timeSignatureObjects || timeSignatureObjects.length === 0) {
            timeSignatureObjects.push({divisor: 4, beatLength: 4, grid: 0, measure: 0});
        }

        output.push(this.buildCommand('VERSION', '0.00.00', ScoreWriter.VERSION));
        output.push(this.buildCommand('FES_MODE', ScoreWriter.FES_MODE));
        output.push(this.buildCommand('BPM_DEF', ...bpmDefs));
        output.push(this.buildCommand('MET_DEF', timeSignatureObjects[0].beatLength.toString(), timeSignatureObjects[0].divisor.toString()));
        output.push(this.buildCommand('RESOLUTION', ScoreWriter.MEASURE_RESOLUTION.toString()));
        output.push(this.buildCommand('CLK_DEF', ScoreWriter.MEASURE_RESOLUTION.toString()));
        output.push(this.buildCommand('COMPATIBLE_CODE', ScoreWriter.COMPATIBLE_CODE));
        output.push('');

        for (const bpmObject of bpmObjects) {
            output.push(this.buildCommand('BPM',
                bpmObject.measure.toString(),
                bpmObject.grid.toString(),
                bpmObject.bpm.toFixed(3).toString()));
        }

        for (const timeSignatureObject of timeSignatureObjects) {
            output.push(this.buildCommand('MET',
                timeSignatureObject.measure.toString(),
                timeSignatureObject.grid.toString(),
                timeSignatureObject.beatLength.toString(),
                timeSignatureObject.divisor.toString()));
        }

        output.push('');

        for (const noteObject of noteObjects) {
            const {measure, grid, position, type} = noteObject;
            const args: string[] = [];
            let command = ScoreWriter.COMMAND_MAP[type];

            if (type === NoteType.SLIDE) {
                const {slideType, waitDuration, travelDuration, endPosition} = <SlideNote>noteObject;
                command = ScoreWriter.SLIDE_COMMAND_MAP[slideType];
                args.push(waitDuration.toString(),
                    travelDuration.toString(),
                    (endPosition - 1).toString());
            } else {
                if (type === NoteType.HOLD || type === NoteType.EX_HOLD || type === NoteType.TOUCH_HOLD) {
                    const {holdLength} = <HoldNote>noteObject;
                    args.push(holdLength ? holdLength.toString() : '0');
                }

                if (type === NoteType.TOUCH_TAP || type === NoteType.TOUCH_HOLD) {
                    const {area, firework} = noteObject;
                    args.push(area.toString());
                    args.push(firework ? '1' : '0');
                    args.push(ScoreWriter.DEFAULT_TOUCH_SIZE)
                }
            }

            output.push(this.buildCommand(command,
                measure.toString(),
                grid.toString(),
                position ? (position - 1).toString() : '0',
                ...args))
        }

        output.push('');

        const {statistics} = notesData;

        if (statistics) {
            output.push(this.buildCommand('T_REC_TAP', statistics.tapCount.toString()));
            output.push(this.buildCommand('T_REC_BRK', statistics.breakCount.toString()));
            output.push(this.buildCommand('T_REC_XTP', statistics.exTapCount.toString()));
            output.push(this.buildCommand('T_REC_HLD', statistics.holdCount.toString()));
            output.push(this.buildCommand('T_REC_XHO', statistics.exHoldCount.toString()));
            output.push(this.buildCommand('T_REC_STR', statistics.starCount.toString()));
            output.push(this.buildCommand('T_REC_BST', statistics.breakStarCount.toString()));
            output.push(this.buildCommand('T_REC_XST', statistics.exStarCount.toString()));
            output.push(this.buildCommand('T_REC_TTP', statistics.touchTapCount.toString()));
            output.push(this.buildCommand('T_REC_THO', statistics.touchHoldCount.toString()));
            output.push(this.buildCommand('T_REC_SLD', statistics.slideCount.toString()));
            output.push(this.buildCommand('T_REC_ALL', statistics.totalNoteCount.toString()));
            output.push(this.buildCommand('T_NUM_TAP', statistics.groupedTapCount.toString()));
            output.push(this.buildCommand('T_NUM_BRK', statistics.groupedBreakCount.toString()));
            output.push(this.buildCommand('T_NUM_HLD', statistics.groupedHoldCount.toString()));
            output.push(this.buildCommand('T_NUM_SLD', statistics.groupedSlideCount.toString()));
            output.push(this.buildCommand('T_NUM_ALL', statistics.totalNoteCount.toString()));
            output.push(this.buildCommand('T_JUDGE_TAP', statistics.judgeTapCount.toString()));
            output.push(this.buildCommand('T_JUDGE_HLD', statistics.judgeHoldCount.toString()));
            output.push(this.buildCommand('T_JUDGE_SLD', statistics.judgeSlideCount.toString()));
            output.push(this.buildCommand('T_JUDGE_ALL', statistics.judgeTotalNoteCount.toString()));
            output.push(this.buildCommand('TTM_EACHPAIRS', statistics.eachPairCount.toString()));
            output.push(this.buildCommand('TTM_SCR_TAP', statistics.maxTapScore.toString()));
            output.push(this.buildCommand('TTM_SCR_BRK', statistics.maxBreakScore.toString()));
            output.push(this.buildCommand('TTM_SCR_HLD', statistics.maxHoldScore.toString()));
            output.push(this.buildCommand('TTM_SCR_SLD', statistics.maxSlideScore.toString()));
            output.push(this.buildCommand('TTM_SCR_ALL', statistics.maxTotalScore.toString()));
            output.push(this.buildCommand('TTM_SCR_S', statistics.scoreBorderS.toString()));
            output.push(this.buildCommand('TTM_SCR_SS', statistics.scoreBorderSS.toString()));
            output.push(this.buildCommand('TTM_RAT_ACV', statistics.maxTotalAchievement.toString()));
        }

        output.push('');

        return output.join('\r\n');
    }

    buildCommand(...params: string[]) {
        let result = '';
        for (const param of params) {
            result += param + '\t';
        }
        return result.substring(0, result.length - 1).trim();
    }
}