import isNumber from "is-number";
import xml2js from "xml2js";
import MusicNotesDifficulty from "../../data/music/MusicNotesDifficulty";

type Ma2MetadataParseResult = {
    id: number,
    title: string,
    artist: string,
    bpm: number,
    notesDataPath: Map<MusicNotesDifficulty, string>,
    designers: Map<MusicNotesDifficulty, string>,
    levels: Map<MusicNotesDifficulty, number>,
    genre: string
};

export default class MetadataParser {
    async parse(data: string): Promise<Ma2MetadataParseResult> {
        try {
            const xml = await xml2js.parseStringPromise(data);
            const root = xml.MusicData;
            const id = Number(root.name[0].id[0]);
            const title = root.name[0].str[0];
            const artist = root.artistName[0].str[0];
            const genre = root.genreName[0].str[0];
            const bpm = Number(root.bpm[0]);
            const notesDataRoot = root.notesData[0].Notes;

            const designers: Map<MusicNotesDifficulty, string> = new Map<MusicNotesDifficulty, string>();
            const notesDataPath: Map<MusicNotesDifficulty, string> = new Map<MusicNotesDifficulty, string>();
            const levels: Map<MusicNotesDifficulty, number> = new Map<MusicNotesDifficulty, number>();
            let difficultyIndex = 0;
            for (const item of notesDataRoot) {
                const difficulty: MusicNotesDifficulty = <MusicNotesDifficulty> (difficultyIndex + 2);
                const fileName = item.file[0].path[0];
                const level = Number(item.level[0]);
                const levelDecimal = Number(item.levelDecimal[0]);
                const designer = item.notesDesigner[0].str[0];

                designers.set(difficulty, designer);
                notesDataPath.set(difficulty, fileName);
                levels.set(difficulty, isNumber(level) && isNumber(levelDecimal) ? level + levelDecimal / 10 :
                    (isNumber(level) ? level : 0));
                difficultyIndex++;
            }

            return {
                id,
                title,
                artist,
                bpm,
                notesDataPath,
                designers,
                levels,
                genre
            };
        } catch (e) {
            throw new Error(`Unable to parse XML: ${e.message}`);
        }
    }
}
