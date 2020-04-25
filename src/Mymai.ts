import commandLineArgs from "command-line-args";
import MymaiCommandLineOptions from "./data/cli/MymaiCommandLineOptions";
import SourceFormat from "./data/cli/SourceFormat";
import Loader from "./loader/Loader";
import Generator from "./generator/Generator";
import SimaiLoader from "./loader/SimaiLoader";
import Ma2Loader from "./loader/Ma2Loader";
import TargetFormat from "./data/cli/TargetFormat";
import SimaiGenerator from "./generator/SimaiGenerator";
import Ma2Generator from "./generator/Ma2Generator";

export default class Mymai {
    public static NAME = "mymai";
    public static VERSION = "0.9.0";
    private options: MymaiCommandLineOptions;
    private loaders: Map<SourceFormat, Loader> = new Map<SourceFormat, Loader>();
    private generators: Map<TargetFormat, Generator> = new Map<TargetFormat, Generator>();

    constructor(args: string[]) {
        this.options = commandLineArgs(this.getOptionDefinitions());
        if (args.length === 0 || this.options.help || this.options.files == null || this.options.files.length == 0) {
            this.showHelp();
        } else {
            this.initLoaders();
            this.initGenerators();

            const sourceFormat = this.options.sourceFormat != null ? SourceFormat[this.options.sourceFormat] : SourceFormat.SIMAI;
            for (const path of this.options.files) {
                this.loadSource(path, sourceFormat);
            }
        }
    }

    loadSource(path: string, format: SourceFormat) {

    }

    initLoaders() {
        this.loaders.set(SourceFormat.SIMAI, new SimaiLoader);
        this.loaders.set(SourceFormat.MA2, new Ma2Loader);
    }

    initGenerators() {
        this.generators.set(TargetFormat.SIMAI, new SimaiGenerator);
        this.generators.set(TargetFormat.MA2, new Ma2Generator);
    }

    getOptionDefinitions() {
        return [
            { name: 'help', alias: 'h', type: Boolean },
            { name: 'outDir', alias: 'o', type: String },
            { name: 'sourceFormat', alias: 's', type: String },
            { name: 'targetFormat', alias: 't', type: String },
            { name: 'files', type: String, multiple: true, defaultOption: true }
        ];
    }

    showHelp() {
        console.log(`Version ${Mymai.VERSION}`);
        console.log(`Usage:    ${Mymai.NAME} [options] [file...]\n`);

        console.log(`Examples: ${Mymai.NAME} tutorial/maidata.txt`);
        console.log(`          ${Mymai.NAME} --outDir ~/converted 0019_acceleration/maidata.txt 0021_fragrance/maidata.txt\n`);

        console.log(`Options:`);
        console.log(` -h, --help             Print this message.`);
        console.log(` -o, --outDir           Specify the output directory. Defaults to 'output'`);
        console.log(` -s, --sourceFormat     Specify the source data format: 'simai' (default), 'ma2'`);
        console.log(` -t, --targetFormat     Specify the target data format: 'ma2' (default), 'simai'`);
    }
}