import Note from "./Note";
import SlideType from "./SlideType";

export default interface SlideNote extends Note {
    endPosition: number;
    waitDuration: number;
    travelDuration: number;
    slideType: SlideType;
}
