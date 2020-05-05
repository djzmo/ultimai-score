import commandLineArgs from "command-line-args";
import {readFileSync, existsSync} from "fs";
import SourceFormat from "./data/cli/SourceFormat";
import TargetFormat from "./data/cli/TargetFormat";
import UltimaiCommandLineOptions from "./data/cli/UltimaiCommandLineOptions";
import Importer from "./importer/Importer";
import Exporter from "./exporter/Exporter";
import SimaiImporter from "./importer/SimaiImporter";
import Ma2Importer from "./importer/Ma2Importer";
import SimaiExporter from "./exporter/SimaiExporter";
import Ma2Exporter from "./exporter/Ma2Exporter";
import FileExtension from "./data/converter/FileExtension";
import Converter from "./converter/Converter";
import AwbWavConverter from "./converter/AwbWavConverter";
import AwbConverterBase from "./converter/AwbConverterBase";
import ConversionPair from "./data/converter/ConversionPair";
import ConverterMap from "./data/converter/ConverterMap";
import AwbMp3Converter from "./converter/AwbMp3Converter";
import WavMp3Converter from "./converter/WavMp3Converter";
import {getAppropriateConverter} from "./util/ConverterUtil";

export default class Ultimai {
    public static NAME = 'ultimai';
    public static VERSION = '1.0.0';
    private isInitialized: boolean = false;
    private _importers: Map<SourceFormat, Importer> = new Map<SourceFormat, Importer>();
    private _exporters: Map<TargetFormat, Exporter> = new Map<TargetFormat, Exporter>();
    private _converters: ConverterMap = new Map<ConversionPair, Converter>();

    get importers() {
        return this._importers;
    }

    get exporters() {
        return this._exporters;
    }

    get converters() {
        return this._converters;
    }

    async handle(args: string[]) {
        const options: UltimaiCommandLineOptions = commandLineArgs(this.getOptionDefinitions());
        if (args.length === 0 || options.help || !options.files || options.files.length == 0) {
            this.showHelp();
        } else {
            if (!this.isInitialized) {
                this.initImporters();
                this.initExporters();
                this.initConverters();
                this.bindConfigs(options);
                this.bindSpecificOptions(options);
                this.bindConverters();
                this.isInitialized = true;
            }

            const sourceFormat = options.sourceFormat ? <SourceFormat>options.sourceFormat : SourceFormat.SIMAI;
            const targetFormat = options.targetFormat ? <TargetFormat>options.targetFormat : TargetFormat.MA2;
            const outDir = options.outDir ? options.outDir : 'output';
            for (const path of options.files) {
                console.log(`Importing source: [${sourceFormat}] ${path}`);
                const transformedPath = path.replace(/\\/g, '/');
                const transformedOutDir = outDir.replace(/\\/g, '/');
                const importer = this._importers.get(sourceFormat);
                const exporter = this._exporters.get(targetFormat);
                if (importer && exporter) {
                    try {
                        if (await importer.analyze(transformedPath)) {
                            const musicData = await importer.import(transformedPath);
                            if (musicData) {
                                console.log(`Exporting target: [${targetFormat}] ${outDir}`);
                                const exportedFiles = await exporter.export(musicData, transformedOutDir);
                                if (exportedFiles && exportedFiles.length > 0) {
                                    console.log(`Export successful. These files were created in the output directory:`);
                                    for (const file of exportedFiles) {
                                        console.log(`- ${file}`);
                                    }
                                } else {
                                    console.log(`Export failed. No files were created.`);
                                }
                            }
                        }
                    } catch (e) {
                        console.log(e.message);
                    }
                } else {
                    if (!importer) {
                        console.log(`No suitable importer was found for '${path}' (${sourceFormat})`);
                    } else {
                        console.log(`No suitable exporter was found for '${path}' (${targetFormat})`);
                    }
                }

                console.log();
            }
        }
    }

    private initImporters() {
        this._importers.set(SourceFormat.SIMAI, new SimaiImporter);
        this._importers.set(SourceFormat.MA2, new Ma2Importer);
    }

    private initExporters() {
        this._exporters.set(TargetFormat.SIMAI, new SimaiExporter);
        this._exporters.set(TargetFormat.MA2, new Ma2Exporter);
    }

    private initConverters() {
        this._converters.set({ from: FileExtension.WAV, to: FileExtension.MP3 }, new WavMp3Converter());
        this._converters.set({ from: FileExtension.AWB, to: FileExtension.WAV }, new AwbWavConverter());
        this._converters.set({ from: FileExtension.AWB, to: FileExtension.MP3 }, new AwbMp3Converter());
    }

    private bindConfigs(options: UltimaiCommandLineOptions) {
        if (existsSync('./config.json')) {
            const rawConfig = readFileSync('./config.json', {encoding: 'utf8'});
            const config = JSON.parse(rawConfig);

            if (!options.outDir && config.outDir) {
                options.outDir = config.outDir;
            }
            if (!options.sourceFormat && config.sourceFormat) {
                if (Object.values(SourceFormat).includes(config.sourceFormat)) {
                    options.sourceFormat = config.sourceFormat;
                } else {
                    throw new Error('Invalid sourceFormat in config.json');
                }
            }
            if (!options.targetFormat && config.targetFormat) {
                if (Object.values(TargetFormat).includes(config.targetFormat)) {
                    options.targetFormat = config.targetFormat;
                } else {
                    throw new Error('Invalid targetFormat in config.json');
                }
            }
            if (options.ignoreSounds != null && config.ignoreSounds != null) {
                options.ignoreSounds = config.ignoreSounds;
            }
            if (config.ma2) {
                const ma2Config = config.ma2;
                if (!options.ma2AcbKey && ma2Config.acbKey) {
                    options.ma2AcbKey = ma2Config.acbKey;
                }
                if (!options.ma2SoundPath && ma2Config.soundPath) {
                    options.ma2SoundPath = ma2Config.soundPath;
                }
                if (!options.ma2MoviePath && ma2Config.moviePath) {
                    options.ma2MoviePath = ma2Config.moviePath;
                }
            }
        }
    }

    private bindSpecificOptions(options: UltimaiCommandLineOptions) {
        if ('ma2:acbKey' in options) {
            options.ma2AcbKey = options['ma2:acbKey'];
            delete options['ma2:acbKey'];
        }
        if ('ma2:moviePath' in options) {
            options.ma2MoviePath = options['ma2:moviePath'];
            delete options['ma2:moviePath'];
        }
        if ('ma2:soundPath' in options) {
            options.ma2SoundPath = options['ma2:soundPath'];
            delete options['ma2:soundPath'];
        }

        if (options.ma2AcbKey) {
            this._converters.forEach((converter, pair) => {
                if (pair.from === FileExtension.AWB) {
                    (<AwbConverterBase> converter).key = options.ma2AcbKey;
                }
            });
        }
        if (options.ma2MoviePath) {
            (<Ma2Importer> this._importers.get(SourceFormat.MA2)).moviePath = options.ma2MoviePath;
            (<Ma2Exporter> this._exporters.get(TargetFormat.MA2)).moviePath = options.ma2MoviePath;
        }
        if (options.ma2SoundPath) {
            (<Ma2Importer> this._importers.get(SourceFormat.MA2)).soundPath = options.ma2SoundPath;
            (<Ma2Exporter> this._exporters.get(TargetFormat.MA2)).soundPath = options.ma2SoundPath;
        }

        this._exporters.forEach(exporter => {
            if (options.ignoreSounds != null) {
                exporter.ignoreSounds = options.ignoreSounds;
            }
        });
    }

    private bindConverters() {
        for (const pair of Array.from(this._converters.keys())) {
            const converter = this._converters.get(pair);
            if (converter) {
                converter.converters = this._converters;
            }
        }

        for (const format of Array.from(this._exporters.keys())) {
            const exporter = this._exporters.get(format);
            if (exporter) {
                exporter.converters = this._converters;
            }
        }
    }

    private getOptionDefinitions() {
        return [
            { name: 'help', alias: 'h', type: Boolean },
            { name: 'outDir', alias: 'o', type: String },
            { name: 'sourceFormat', alias: 's', type: String },
            { name: 'targetFormat', alias: 't', type: String },
            { name: 'ignoreSounds', type: Boolean },
            { name: 'ma2:acbKey', type: String },
            { name: 'ma2:moviePath', type: String },
            { name: 'ma2:soundPath', type: String },
            { name: 'files', type: String, multiple: true, defaultOption: true }
        ];
    }

    private showHelp() {
        console.log(`Version ${Ultimai.VERSION}`);
        console.log(`Usage:    ${Ultimai.NAME} [options] [file...]\n`);

        console.log(`Examples: ${Ultimai.NAME} tutorial/maidata.txt`);
        console.log(`          ${Ultimai.NAME} --outDir ~/library 0019_acceleration/maidata.txt 0021_fragrance/maidata.txt`);
        console.log(`          ${Ultimai.NAME} -s ma2 -t simai 123456/Music.xml\n`);

        console.log(`Options:`);
        console.log(` -h, --help             Print this message.`);
        console.log(` -o, --outDir           Specify the output directory. Defaults to 'output'`);
        console.log(` -s, --sourceFormat     Specify the source data format: 'simai' (default), 'ma2'`);
        console.log(` -t, --targetFormat     Specify the target data format: 'ma2' (default), 'simai'`);
        console.log(` --ignoreSounds         Use this flag to disable sound conversion`);
        console.log(` --ma2:acbKey           (ma2) Specify the key for acb conversion`);
        console.log(` --ma2:moviePath        (ma2) Specify the path containing movie files`);
        console.log(` --ma2:soundPath        (ma2) Specify the path containing sound files`);
    }
}
