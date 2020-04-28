import {promises} from "fs";
import MetadataParser from "../../../src/importer/ma2/MetadataParser";
import MusicNotesDifficulty from "../../../src/data/music/MusicNotesDifficulty";

const {readFile} = promises;

describe('ma2 metadata parser', () => {
    it('should parse metadata correctly', async () => {
        const data = await readFile('tests/resources/Music.xml', {encoding: 'utf8'});
        const parser = new MetadataParser;
        const {id, title, artist, bpm, notesDataPath, designers, levels, genre} = await parser.parse(data);
        expect(id).toBe(999999);
        expect(title).toBe('ここに曲名を書く');
        expect(artist).toBe('ここにアーティスト名を書く');
        expect(bpm).toBe(120);
        expect(notesDataPath.size).toBe(6);
        expect(designers.size).toBe(5);
        expect(levels.size).toBe(3);
        expect(genre).toBe('バラエティ');
        expect(notesDataPath.get(MusicNotesDifficulty.BASIC)).toBe('999999_00.ma2');
        expect(notesDataPath.get(MusicNotesDifficulty.ADVANCED)).toBe('999999_01.ma2');
        expect(notesDataPath.get(MusicNotesDifficulty.EXPERT)).toBe('999999_02.ma2');
        expect(notesDataPath.get(MusicNotesDifficulty.MASTER)).toBe('999999_03.ma2');
        expect(notesDataPath.get(MusicNotesDifficulty.RE_MASTER)).toBe('999999_04.ma2');
        expect(designers.get(MusicNotesDifficulty.BASIC)).toBe('BASIC ノーツデザイナー名義を書く');
        expect(designers.get(MusicNotesDifficulty.ADVANCED)).toBe('ADVANCED ノーツデザイナー名義を書く');
        expect(designers.get(MusicNotesDifficulty.EXPERT)).toBe('EXPERT ノーツデザイナー名義を書く');
        expect(designers.get(MusicNotesDifficulty.MASTER)).toBe('MASTER ノーツデザイナー名義を書く');
        expect(designers.get(MusicNotesDifficulty.RE_MASTER)).toBe('Re:MASTER ノーツデザイナー名義を書');
        expect(levels.get(MusicNotesDifficulty.BASIC)).toBe(10);
        expect(levels.get(MusicNotesDifficulty.ADVANCED)).toBe(12.5);
        expect(levels.get(MusicNotesDifficulty.EXPERT)).toBe(99);
    });
});