import NoteType from "./NoteType";
import BaseObject from "./BaseObject";
import TouchArea from "./TouchArea";

export default interface Note extends BaseObject {
    position?: number;
    area: TouchArea;
    type: NoteType;
}
