import MusicData from "../data/music/MusicData";

export default abstract class Generator {
    abstract generate(data: MusicData): string;
}