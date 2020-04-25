import Note from "./object/Note";
import Bpm from "./object/Bpm";
import TimeSignature from "./object/TimeSignature";

export default interface MusicNotesData {
    level: number;
    designer?: string;
    filePath?: string;
    gridsPerMeasure: number;
    noteObjects: Note[];
    bpmObjects: Bpm[];
    timeSignatureObjects: TimeSignature[];
}
