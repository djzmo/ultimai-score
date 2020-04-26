import MusicData from "../MusicData";

export default interface Ma2MusicData extends MusicData {
    id: number;
    notesDataPath: Map<MusicNotesDifficulty, string>;
}
