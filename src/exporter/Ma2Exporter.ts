import {promises, existsSync} from 'fs';
import randomize from 'randomatic';
import {create} from 'xmlbuilder2';
import mkdirp from 'mkdirp';
import Exporter from './Exporter';
import MusicData from '../data/music/MusicData';
import MusicNotesData from '../data/music/MusicNotesData';
import NoteType from '../data/music/object/NoteType';
import SlideType from '../data/music/object/SlideType';
import SlideNote from '../data/music/object/SlideNote';
import HoldNote from '../data/music/object/HoldNote';
import MusicNotesDifficulty from "../data/music/MusicNotesDifficulty";

const {writeFile} = promises;

export default class Ma2Exporter extends Exporter {
    private static MEASURE_RESOLUTION = 384;
    private static VERSION = '1.03.00';
    private static FES_MODE = '0';
    private static COMPATIBLE_CODE = 'MA2';
    private static DEFAULT_TOUCH_SIZE = 'M1';
    private static DEFAULT_NET_OPEN_NAME = 'Net191101';
    private static DEFAULT_RELEASE_TAG = 'Ver1.00.00';

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

    private static MUSIC_LEVEL_MAP = {
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        '7': 7, '7P': 8, '8': 9, '8P': 10, '9': 11, '9P': 12,
        '10': 13, '10P': 14, '11': 15, '11P': 16, '12': 17, '12P': 18,
        '13': 19, '13P': 20, '14': 21, '14P': 22, '15': 23, '15P': 24
    };

    async export(data: MusicData, outputPath: string): Promise<string[]> {
        outputPath = outputPath.replace(/\\/g, '/');
        if (outputPath.endsWith('/')) {
            outputPath = outputPath.substring(0, outputPath.length - 1);
        }

        const id = `012${randomize('0', 3)}`;
        const paths: string[] = [];
        const musicDirectory = `${outputPath}/music${id}`;

        if (!existsSync(musicDirectory)) {
            await mkdirp(musicDirectory);
        }

        const metadataPath = `${musicDirectory}/Music.xml`;
        const metadataContents = this.renderMetadata(data, id);

        if (metadataContents && metadataContents.length > 0) {
            await writeFile(metadataPath, metadataContents);
            paths.push(metadataPath);
        }

        for (const difficulty of Array.from(data.notesData.keys())) {
            const notesData = data.notesData.get(difficulty);
            if (notesData) {
                const ma2Difficulty = difficulty - 2;
                const path = `${musicDirectory}/${id}_0${ma2Difficulty}.ma2`;
                const contents = this.renderNotes(notesData, data.bpm ? data.bpm : 120);
                if (contents && contents.length > 0) {
                    await writeFile(path, contents);
                    paths.push(path);
                }
            }
        }

        return paths;
    }

    renderMetadata(data: MusicData, id: string): string {
        const shortId = Number(id).toString();
        const root = create({version: '1.0', encoding: 'utf-8'})
            .ele('MusicData')
                .ele('dataName').txt(`music${id}`).up()
                .ele('netOpenName')
                    .ele('id').txt('0').up()
                    .ele('str').txt(Ma2Exporter.DEFAULT_NET_OPEN_NAME).up().up()
                .ele('releaseTagName')
                    .ele('id').txt('1').up()
                    .ele('str').txt(Ma2Exporter.DEFAULT_RELEASE_TAG).up().up()
                .ele('disable').txt('false').up()
                .ele('name')
                    .ele('id').txt(shortId.toString()).up()
                    .ele('str').txt(data.title ? data.title : '').up().up()
                .ele('rightsInfoName')
                    .ele('id').txt('0').up()
                    .ele('str').up().up()
                .ele('sortName').txt(data.title ? data.title?.replace(/[^A-Z0-9]/ig, '') : '').up()
                .ele('artistName')
                    .ele('id').txt('999').up()
                    .ele('str').txt(data.artist ? data.artist : '').up().up()
                .ele('genreName')
                    .ele('id').txt('104').up()
                    .ele('str').txt('バラエティ').up().up()
                .ele('bpm').txt(data.bpm ? data.bpm?.toString() : '120').up()
                .ele('version').txt('20000').up()
                .ele('AddVersion')
                    .ele('id').txt('13').up()
                    .ele('str').txt('maimaDX').up().up()
                .ele('movieName')
                    .ele('id').txt(shortId.toString()).up()
                    .ele('str').txt(data.title ? data.title : '').up().up()
                .ele('cueName')
                    .ele('id').txt(shortId.toString()).up()
                    .ele('str').txt(data.title ? data.title : '').up().up()
                .ele('dresscode').txt('false').up()
                .ele('eventName')
                    .ele('id').txt('0').up()
                    .ele('str').up().up()
                .ele('subEventName')
                    .ele('id').txt('0').up()
                    .ele('str').up().up()
                .ele('lockType').txt('0').up()
                .ele('subLockType').txt('1').up()
                .ele('notesData');

        for (let i = 0; i <= 5; i++) {
            const baseDifficulty = <unknown>MusicNotesDifficulty[i + 2];
            const notesData = data.notesData.get(<MusicNotesDifficulty>baseDifficulty);
            const level = notesData && notesData.level ? notesData.level : 0;
            const levelDecimal = level % 1;
            const levelSlug = levelDecimal > 0 && level >= 7 ? level.toString() + 'P' : level.toString();
            const musicLevelId = Ma2Exporter.MUSIC_LEVEL_MAP[levelSlug];
            const designer = notesData && notesData.designer ? notesData.designer : '-';
            root.ele('Notes')
                .ele('file')
                    .ele('path').txt(`${id}_0${i}.ma2`).up().up()
                .ele('level').txt(level.toString()).up()
                .ele('levelDecimal').txt(levelDecimal.toString()).up()
                .ele('notesDesigner')
                    .ele('id').txt('999').up()
                    .ele('str').txt(designer).up().up()
                .ele('notesType').txt('0').up()
                .ele('musicLevelID').txt(musicLevelId).up()
                .ele('isTouchEnable').txt('false').up()
                .ele('isEnable').txt('false').up();
        }

        root.up().ele('jacketFile').up()
            .ele('thumbnailName').up()
            .ele('rightFile').up()
            .ele('priority').txt('0');

        return root.end({prettyPrint: true});
    }

    renderNotes(notesData: MusicNotesData, defaultBpm: number): string {
        const output: string[] = [];
        const {noteObjects, bpmObjects, timeSignatureObjects} = notesData;
        const bpmDef = defaultBpm.toFixed(3).toString();

        if (!timeSignatureObjects || timeSignatureObjects.length === 0) {
            timeSignatureObjects.push({divisor: 4, beatLength: 4, grid: 0, measure: 0});
        }

        output.push(this.buildCommand('VERSION', '0.00.00', Ma2Exporter.VERSION));
        output.push(this.buildCommand('FES_MODE', Ma2Exporter.FES_MODE));
        output.push(this.buildCommand('BPM_DEF', bpmDef.toString(), bpmDef.toString(), bpmDef.toString(), bpmDef.toString()));
        output.push(this.buildCommand('MET_DEF', timeSignatureObjects[0].beatLength.toString(), timeSignatureObjects[0].divisor.toString()));
        output.push(this.buildCommand('CLK_DEF', Ma2Exporter.MEASURE_RESOLUTION.toString()));
        output.push(this.buildCommand('COMPATIBLE_CODE', Ma2Exporter.COMPATIBLE_CODE));
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
            let command = Ma2Exporter.COMMAND_MAP[type];

            if (type === NoteType.SLIDE) {
                const {slideType, waitDuration, travelDuration, endPosition} = <SlideNote>noteObject;
                command = Ma2Exporter.SLIDE_COMMAND_MAP[slideType];
                args.push(waitDuration.toString(),
                    travelDuration.toString(),
                    endPosition.toString());
            } else {
                if (type === NoteType.HOLD || type === NoteType.EX_HOLD || type === NoteType.TOUCH_HOLD) {
                    const {holdLength} = <HoldNote>noteObject;
                    args.push(holdLength ? holdLength.toString() : '0');
                }

                if (type === NoteType.TOUCH_TAP || type === NoteType.TOUCH_HOLD) {
                    const {area, firework} = noteObject;
                    args.push(area.toString());
                    args.push(firework ? '1' : '0');
                    args.push(Ma2Exporter.DEFAULT_TOUCH_SIZE)
                }
            }


            output.push(this.buildCommand(command,
                measure.toString(),
                grid.toString(),
                position ? position.toString() : '0',
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
            result += param;
            const spacesCount = 4 - param.length % 4;
            for (let i = 0; i < spacesCount; i++) {
                result += ' ';
            }
        }
        return result;
    }
}
