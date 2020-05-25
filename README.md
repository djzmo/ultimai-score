# ultimai-score

ultimai-score is a score format converter tool for that washing machine game simulator. 

It currently supports two-way format conversion between:

- simai - [3simai specification](https://w.atwiki.jp/simai/pages/25.html)
- ma2

## Usage

``` sh
$ ultimai
Usage:    ultimai [options] [file...]

Examples: ultimai tutorial/maidata.txt
          ultimai --outDir ~/library 0019_acceleration/maidata.txt 0021_fragrance/maidata.txt
          ultimai -s ma2 -t simai 123456/Music.xml

Options:
 -h, --help             Print this message.
 -o, --outDir           Specify the output directory. Defaults to 'output'
 -s, --sourceFormat     Specify the source data format: 'simai' (default), 'ma2'
 -t, --targetFormat     Specify the target data format: 'ma2' (default), 'simai'
 --ignoreSounds         Use this flag to disable sound conversion
 --ma2:acbKey           (ma2) Specify the key for acb conversion
 --ma2:moviePath        (ma2) Specify the path containing movie files
 --ma2:soundPath        (ma2) Specify the path containing sound files
```

Alternatively, you can specify options by creating a `config.json` file within the same directory. Please refer to [config.json.example](https://github.com/djzmo/ultimai/blob/master/config.json.example) as example.

#### Audio Transcoding

The tool uses [SoX](http://sox.sourceforge.net/) to transcode audio files. Please install it beforehand or use `--ignoreSounds` flag if you do not wish to transcode audio files.

[Binary for all OSes including Windows](https://sourceforge.net/projects/sox/files/sox/)

MacOS / Linux installation via Brew

```
brew install sox
```

#### Build Instructions

``` sh
$ git clone git@github.com:djzmo/ultimai
$ cd ultimai
$ npm i -g typescript pkg
$ npm i
$ tsc
$ pkg . --out-path ./bin
```

#### Run Tests

``` sh
$ npm run test
```

## Downloads

See [Releases](https://github.com/djzmo/ultimai/releases) page.

## Known Limitations

- Encoding to ACB/AWB is not yet supported
- Movie and jacket file conversion is not yet supported

## License

ultimai is released under the 
[GNU General Public License version 2](https://www.gnu.org/licenses/gpl-2.0.txt), 
which is distributed in the COPYING file.
