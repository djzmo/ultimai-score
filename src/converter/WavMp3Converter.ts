import SoxCommand from "sox-audio";
import Converter from "./Converter";

export default class WavMp3Converter extends Converter {
    async convert(sourceFile: string, outDir?: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            outDir = this.normalizeOutDir(outDir);
            const fileName = sourceFile.indexOf('/') != -1 ? sourceFile.substring(sourceFile.lastIndexOf('/') + 1) : sourceFile;
            const fileNameNoExt = fileName.substring(0, fileName.lastIndexOf('.'));
            const outputPath = outDir + fileNameNoExt + '.mp3';
            const command = SoxCommand()
                .input(sourceFile)
                .output(outputPath)
                .outputFileType('mp3');

            command.on('error', (err, stdout, stderr) => {
                reject(new Error(err.message));
            });

            command.on('end', () => {
                resolve([outputPath]);
            });

            command.run();
        });
    }
}
