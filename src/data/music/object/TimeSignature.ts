import BaseObject from "./BaseObject";

export default interface TimeSignature extends BaseObject {
    divisor: number;
    beatLength: number;
}
