import MusicData from "../data/music/MusicData";

export default abstract class Exporter {
    abstract export(data: MusicData): string;
}