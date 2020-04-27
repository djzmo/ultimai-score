import Exporter from "./Exporter";
import MusicData from "../data/music/MusicData";
import Bpm from "../data/music/object/Bpm";
import Note from "../data/music/object/Note";
import NoteType from "../data/music/object/NoteType";
import TouchArea from "../data/music/object/TouchArea";
import HoldNote from "../data/music/object/HoldNote";
import SlideNote from "../data/music/object/SlideNote";
import SlideType from "../data/music/object/SlideType";
import MaidataWriter from "./simai/MaidataWriter";

export default class SimaiExporter extends Exporter {
    async export(data: MusicData): Promise<string[]> {
        const writer = new MaidataWriter(data);
        return [];
    }
}