import MusicData from "../MusicData";

export default interface SimaiMusicData extends MusicData {
    seek?: number;
    offset?: number;
    trackPath?: string;
    moviePath?: string;
}
