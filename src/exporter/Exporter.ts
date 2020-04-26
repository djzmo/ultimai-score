import MusicData from "../data/music/MusicData";

export default abstract class Exporter {
    /**
     * Exports music data to a target format.
     * @param data - The {@link MusicData} to be exported.
     * @param outputPath - Output directory path where files will be created.
     * @return {Promise<string[]>} Names of exported file.
     */
    abstract export(data: MusicData, outputPath: string): Promise<string[]>;
}
