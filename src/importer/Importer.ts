import MusicData from "../data/music/MusicData";

export default abstract class Importer {
    /**
     * Imports a file as a source format.
     * @param path - Path to the main entry-point file for the source format.
     * @return The resulting {@link MusicData}.
     */
    abstract import(path: string): Promise<MusicData>;
}
