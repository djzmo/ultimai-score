import Note from "./Note";
import SlideType from "./SlideType";

export default interface SlideNote extends Note {
    endPosition: number;
    waitLength: number;
    slideLength: number;
    slideType: SlideType;
}
