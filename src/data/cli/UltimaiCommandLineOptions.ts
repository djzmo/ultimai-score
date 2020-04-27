import {CommandLineOptions} from "command-line-args";

export default interface UltimaiCommandLineOptions extends CommandLineOptions {
    help?: boolean;
    outDir?: string;
    sourceFormat?: string;
    targetFormat?: string;
    files?: string[];
}
