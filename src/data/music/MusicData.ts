import MusicNotesData from "./MusicNotesData";
import MusicNotesDifficulty from "./MusicNotesDifficulty";

export default interface MusicData {
    id?: string;
    title?: string;
    artist?: string;
    genre?: string;
    bpm?: number;
    notesData: Map<MusicNotesDifficulty, MusicNotesData>;
    thumbnailPath?: string;
    moviePath?: string;
    trackPath?: string;
}
