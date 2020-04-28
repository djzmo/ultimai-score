import {create} from "xmlbuilder2";
import MusicData from "../../data/music/MusicData";
import MusicNotesDifficulty from "../../data/music/MusicNotesDifficulty";

export default class MetadataWriter {
    private static DEFAULT_NET_OPEN_NAME = 'Net191101';
    private static DEFAULT_RELEASE_TAG = 'Ver1.00.00';
    private static DEFAULT_GENRE_ID = 104;
    private static DEFAULT_GENRE_STRING = 'バラエティ';
    private static DEFAULT_ADD_VERSION_ID = 13;
    private static DEFAULT_ADD_VERSION_STRING = 'maimaDX';

    private static MUSIC_LEVEL_MAP = {
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        '7': 7, '7P': 8, '8': 9, '8P': 10, '9': 11, '9P': 12,
        '10': 13, '10P': 14, '11': 15, '11P': 16, '12': 17, '12P': 18,
        '13': 19, '13P': 20, '14': 21, '14P': 22, '15': 23, '15P': 24
    };

    private _output: string;

    constructor(data: MusicData, id: string) {
        this._output = this.build(data, id);
    }

    get output(): string {
        return this._output;
    }

    private build(data: MusicData, id: string) {
        const shortId = Number(id).toString();
        const root = create({version: '1.0', encoding: 'utf-8'})
            .ele('MusicData')
            .ele('dataName').txt(`music${id}`).up()
            .ele('netOpenName')
            .ele('id').txt('0').up()
            .ele('str').txt(MetadataWriter.DEFAULT_NET_OPEN_NAME).up().up()
            .ele('releaseTagName')
            .ele('id').txt('1').up()
            .ele('str').txt(MetadataWriter.DEFAULT_RELEASE_TAG).up().up()
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
            .ele('id').txt(MetadataWriter.DEFAULT_GENRE_ID.toString()).up()
            .ele('str').txt(MetadataWriter.DEFAULT_GENRE_STRING).up().up()
            .ele('bpm').txt(data.bpm ? data.bpm?.toString() : '120').up()
            .ele('version').txt('20000').up()
            .ele('AddVersion')
            .ele('id').txt(MetadataWriter.DEFAULT_ADD_VERSION_ID.toString()).up()
            .ele('str').txt(MetadataWriter.DEFAULT_ADD_VERSION_STRING).up().up()
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
            const musicLevelId = MetadataWriter.MUSIC_LEVEL_MAP[levelSlug];
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
}
