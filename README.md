# ultimai

ultimai is a score format converter tool for that washing machine game simulator. 

It currently supports format conversion between:

- simai - [3simai specification](https://w.atwiki.jp/simai/pages/25.html)
- Ma2

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
```

#### Build Instructions

``` sh
$ git clone git@github.com:djzmo/ultimai
$ cd ultimai
$ npm i -g tsc pkg
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

The tool is not able to convert complementary assets yet such as jackets, sounds, and movies.

## License

ultimai is released under the 
[GNU General Public License version 2](https://www.gnu.org/licenses/gpl-2.0.txt), 
which is distributed in the COPYING file.
