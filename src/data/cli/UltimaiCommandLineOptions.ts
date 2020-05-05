import {CommandLineOptions} from "command-line-args";

export default interface UltimaiCommandLineOptions extends CommandLineOptions {
    help?: boolean;
    outDir?: string;
    sourceFormat?: string;
    targetFormat?: string;
    ignoreSounds?: boolean;
    files?: string[];
    ma2AcbKey?: string;
    ma2MoviePath?: string;
    ma2SoundPath?: string;
}
