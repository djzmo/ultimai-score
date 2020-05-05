import MusicData from "../MusicData";
import MusicNotesDifficulty from "../MusicNotesDifficulty";

export default interface Ma2MusicData extends MusicData {
    notesDataPath: Map<MusicNotesDifficulty, string>;
}
