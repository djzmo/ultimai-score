import Note from "./Note";

export default interface HoldNote extends Note {
    holdLength: number;
}