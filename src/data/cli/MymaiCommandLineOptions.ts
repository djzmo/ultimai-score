import {CommandLineOptions} from "command-line-args";

export default interface MymaiCommandLineOptions extends CommandLineOptions {
    help?: boolean;
    outDir?: string;
    sourceFormat?: string;
    targetFormat?: string;
    files?: string[];
}