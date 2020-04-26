import Loader from "./Loader";
import MusicData from "../data/music/MusicData";
import Ma2MusicData from "../data/music/format/Ma2MusicData";
import MusicNotesData from "../data/music/MusicNotesData";

export default class Ma2Loader extends Loader {
    public load(path: string): Promise<MusicData> {
        const musicData = this.loadMusic(path);
        // TODO
        return musicData;
    }

    private async loadMusic(path: string): Promise<Ma2MusicData> {
        return {id: 1, title: "", artist: "", bpm: 0, notesData: new Map<MusicNotesDifficulty, MusicNotesData>(), notesDataPath: new Map<MusicNotesDifficulty, string>()}
    }
}