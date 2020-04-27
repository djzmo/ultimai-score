import MusicData from "../data/music/MusicData";

export default abstract class Importer {
    /**
     * Analyzes given input path to determine its validity.
     * @param path - Path to the main entry-point file for the source format.
     * @return boolean result to decide whether to continue operation or not.
     */
    abstract analyze(path: string): Promise<boolean>;

    /**
     * Imports into a source format.
     * @param path - Path to the main entry-point file for the source format.
     * @return The resulting {@link MusicData}.
     */
    abstract import(path: string): Promise<MusicData>;
}
