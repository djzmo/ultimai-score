import MusicData from "../data/music/MusicData";

export default abstract class Loader {
    abstract load(path: string): Promise<MusicData>;
}
