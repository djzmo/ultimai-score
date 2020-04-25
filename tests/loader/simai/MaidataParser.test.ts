import {promises as fsPromises} from "fs";
import MaidataParser from "../../../src/loader/simai/MaidataParser";

const {readFile} = fsPromises;

test('should return correct items', async () => {
    const data = await readFile('tests/resources/maidata.txt', {encoding: 'utf8'});
    const parser = new MaidataParser(data);
    expect(parser.getString('title')).toBe('ここに曲名を書く');
    expect(parser.getString('artist')).toBe('ここにアーティスト名を書く');
    expect(parser.getString('des')).toBe('全難易度共通 ノーツデザイナー名義を書く');
    expect(parser.getString('des_2')).toBe('BASIC ノーツデザイナー名義を書く');
    expect(parser.getString('des_4')).toBe('EXPERT ノーツデザイナー名義を書く');
    expect(parser.getString('seek')).toBe('0');
    expect(parser.getString('first')).toBe('2.000');
    expect(parser.getString('lv_2')).toBe('10');
    expect(parser.getString('lv_3')).toBe('12+');
    expect(parser.getString('lv_4')).toBe('99');
    expect(parser.getString('lv_5')).toBe('※あ');
    expect(parser.getString('inote_1')).toBe('');
    expect(parser.getString('inote_2')).toBe('(120){1}1,2,3/6,45,1b,7b,3/5b,4b/6,{1},1h[1:1],2h[2:1],3h[4:1],4h[8:1],5h[2:1]/6h[4:1],{1},');
    expect(parser.getString('inote_3')).toBe('(100){1}1-3[4:1],1-4[4:1],1-5[4:1],1-6[4:1],1-7[4:1],1>1[4:1],1>2[4:1],1>3[4:1],1>4[4:1],1>5[4:1],' +
        '1>6[4:1],1>7[4:1],1>8[4:1],1<1[4:1],1<2[4:1],1<3[4:1],1<4[4:1],1<5[4:1],1<6[4:1],1<7[4:1],1<8[4:1],1p1[4:1],1p2[4:1],1p3[4:1],1p4[4:1],1p5[4:1],1p6[4:1],' +
        '1p7[4:1],1p8[4:1],1q1[4:1],1q2[4:1],1q3[4:1],1q4[4:1],1q5[4:1],1q6[4:1],1q7[4:1],1q8[4:1],1v2[4:1],1v3[4:1],1v4[4:1],1v6[4:1],1v7[4:1],1v8[4:1],1s5[4:1],' +
        '1z5[4:1],1pp1[4:1],1pp2[4:1],1pp3[4:1],1pp4[4:1],1pp5[4:1],1pp6[4:1],1pp7[4:1],1pp8[4:1],1qq1[4:1],1qq2[4:1],1qq3[4:1],1qq4[4:1],1qq5[4:1],1qq6[4:1],' +
        '1qq7[4:1],1qq8[4:1],1V35[4:1],1V36[4:1],1V37[4:1],1V38[4:1],1V75[4:1],1V74[4:1],1V73[4:1],1V72[4:1],1w5[4:1],{1},');
    expect(parser.getString('inote_4')).toBe('(120){2}B1,B2,B3,B4,B5,B6,B7,B8,{4}E1,E2,E3,E4,E5,E6,E7,E8,{1}Cf,Ch[2:1],Chf[2:1],{1},');
    expect(parser.getString('inote_5')).toBe('(120){1}1,(130){1}1,(140){1}1,(150){1}1,(160){1}1,(170){1}1,(180){1}1,(190){1}1,(200){1}1,(120){1},');
    expect(parser.getString('inote_6')).toBe('(120){1}1,{2}1,5,{4}1,3,5,7,{8}1,2,3,4,5,6,7,8,{16}1b,2,3,4,5,6,7,8,1b,2,3,4,5,6,7,8,' +
        '{32}1b,2,3,4,5,6,7,8,1b,2,3,4,5,6,7,8,1b,2,3,4,5,6,7,8,1b,2,3,4,5,6,7,8,{1},');
});
