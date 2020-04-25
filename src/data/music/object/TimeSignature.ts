import BaseObject from "./BaseObject";

export default interface TimeSignature extends BaseObject {
    measureDivisor: number;
    lengthPerBeat: number;
}
