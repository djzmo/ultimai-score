
export default abstract class Converter {
    converters?;

    abstract convert(sourceFile: string, outDir?: string): Promise<string[]>;

    normalizeOutDir(outDir?: string) {
        if (!outDir) {
            return './';
        }

        if (!outDir.endsWith('/')) {
            outDir += '/';
        }

        return outDir;
    }
}
