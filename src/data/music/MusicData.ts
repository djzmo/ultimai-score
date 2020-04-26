import MusicNotesData from "./MusicNotesData";

export default interface MusicData {
    title?: string;
    artist?: string;
    genre?: string;
    bpm?: number;
    notesData: Map<MusicNotesDifficulty, MusicNotesData>;
}
