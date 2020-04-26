import MusicData from "../data/music/MusicData";

export default abstract class Importer {
    abstract import(path: string): Promise<MusicData>;
}
