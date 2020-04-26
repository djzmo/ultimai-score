import NoteType from "./object/NoteType";

export default class MusicStatistics {
    private static TAP_SCORE = 500;
    private static HOLD_SCORE = 1000;
    private static SLIDE_SCORE = 1500;
    private static BREAK_SCORE = 2600;

    // Individual notes
    private _tapCount: number;
    private _breakCount: number;
    private _holdCount: number;
    private _starCount: number;
    private _breakStarCount: number;
    private _exTapCount: number;
    private _exHoldCount: number;
    private _exStarCount: number;
    private _touchTapCount: number;
    private _touchHoldCount: number;
    private _slideCount: number;

    // Totals / aggregates
    private _totalNoteCount: number;
    private _groupedTapCount: number;
    private _groupedHoldCount: number;
    private _groupedBreakCount: number;
    private _groupedSlideCount: number;
    private _judgeTapCount: number;
    private _judgeHoldCount: number;
    private _judgeSlideCount: number;
    private _judgeTotalNoteCount: number;
    private _eachPairCount: number;
    private _maxTapScore: number;
    private _maxBreakScore: number;
    private _maxHoldScore: number;
    private _maxSlideScore: number;
    private _maxTotalScore: number;
    private _scoreBorderS: number;
    private _scoreBorderSS: number;
    private _maxTotalAchievement: number;
    
    constructor() {
        this._tapCount = 0;
        this._breakCount = 0;
        this._holdCount = 0;
        this._starCount = 0;
        this._breakStarCount = 0;
        this._exTapCount = 0;
        this._exHoldCount = 0;
        this._exStarCount = 0;
        this._touchTapCount = 0;
        this._touchHoldCount = 0;
        this._slideCount = 0;
        this._totalNoteCount = 0;
        this._groupedTapCount = 0;
        this._groupedHoldCount = 0;
        this._groupedBreakCount = 0;
        this._groupedSlideCount = 0;
        this._judgeTapCount = 0;
        this._judgeHoldCount = 0;
        this._judgeSlideCount = 0;
        this._judgeTotalNoteCount = 0;
        this._eachPairCount = 0;
        this._maxTapScore = 0;
        this._maxBreakScore = 0;
        this._maxHoldScore = 0;
        this._maxSlideScore = 0;
        this._maxTotalScore = 0;
        this._scoreBorderS = 0;
        this._scoreBorderSS = 0;
        this._maxTotalAchievement = 0;
    }

    calculateTotals() {
        this._totalNoteCount = this._tapCount + this._holdCount + this._starCount + this._breakStarCount +
            this._exTapCount + this._exHoldCount + this._exStarCount + this._touchTapCount + this._touchHoldCount +
            this._slideCount;
        this._groupedTapCount = this._tapCount + this._starCount + this._exTapCount + this._exStarCount + this._touchTapCount;
        this._groupedHoldCount = this._holdCount + this._exHoldCount + this._touchHoldCount;
        this._groupedBreakCount = this._breakCount + this._breakStarCount;
        this._groupedSlideCount = this._slideCount;
        this._judgeTapCount = this._groupedTapCount + this._groupedBreakCount;
        this._judgeHoldCount = this._groupedHoldCount;
        this._judgeSlideCount = this._groupedSlideCount;
        this._judgeTotalNoteCount = this._judgeTapCount + this._judgeHoldCount + this._judgeSlideCount;
        this._maxTapScore = this._groupedTapCount * MusicStatistics.TAP_SCORE;
        this._maxHoldScore = this._groupedHoldCount * MusicStatistics.HOLD_SCORE;
        this._maxSlideScore = this._groupedSlideCount * MusicStatistics.SLIDE_SCORE;
        this._maxBreakScore = this._groupedBreakCount * MusicStatistics.BREAK_SCORE;
        this._maxTotalScore = this._maxTapScore + this._maxHoldScore + this._maxSlideScore + this._maxBreakScore;
        this._maxTotalAchievement = this._maxTotalScore / (this._maxTotalScore - this._groupedBreakCount * 100);
    }

    increment(type: NoteType): void {
        switch (type) {
            case NoteType.TAP:
                this._tapCount++;
                break;
            case NoteType.HOLD:
                this._holdCount++;
                break;
            case NoteType.BREAK:
                this._breakCount++;
                break;
            case NoteType.STAR:
                this._starCount++;
                break;
            case NoteType.BREAK_STAR:
                this._breakStarCount++;
                break;
            case NoteType.EX_TAP:
                this._exTapCount++;
                break;
            case NoteType.EX_HOLD:
                this._exHoldCount++;
                break;
            case NoteType.EX_STAR:
                this._exStarCount++;
                break;
            case NoteType.SLIDE:
                this._slideCount++;
                break;
            case NoteType.TOUCH_TAP:
                this._touchTapCount++;
                break;
            case NoteType.TOUCH_HOLD:
                this._touchHoldCount++;
                break;
        }
    }

    eachPair() {
        this._eachPairCount++;
    }

    get tapCount(): number {
        return this._tapCount;
    }

    get breakCount(): number {
        return this._breakCount;
    }

    get holdCount(): number {
        return this._holdCount;
    }

    get starCount(): number {
        return this._starCount;
    }

    get breakStarCount(): number {
        return this._breakStarCount;
    }

    get exTapCount(): number {
        return this._exTapCount;
    }

    get exHoldCount(): number {
        return this._exHoldCount;
    }

    get exStarCount(): number {
        return this._exStarCount;
    }

    get touchTapCount(): number {
        return this._touchTapCount;
    }

    get touchHoldCount(): number {
        return this._touchHoldCount;
    }

    get slideCount(): number {
        return this._slideCount;
    }

    get totalNoteCount(): number {
        return this._totalNoteCount;
    }

    get groupedTapCount(): number {
        return this._groupedTapCount;
    }

    get groupedHoldCount(): number {
        return this._groupedHoldCount;
    }

    get groupedBreakCount(): number {
        return this._groupedBreakCount;
    }

    get groupedSlideCount(): number {
        return this._groupedSlideCount;
    }

    get judgeTapCount(): number {
        return this._judgeTapCount;
    }

    get judgeHoldCount(): number {
        return this._judgeHoldCount;
    }

    get judgeSlideCount(): number {
        return this._judgeSlideCount;
    }

    get judgeTotalNoteCount(): number {
        return this._judgeTotalNoteCount;
    }

    get eachPairCount(): number {
        return this._eachPairCount;
    }

    get maxTapScore(): number {
        return this._maxTapScore;
    }

    get maxBreakScore(): number {
        return this._maxBreakScore;
    }

    get maxHoldScore(): number {
        return this._maxHoldScore;
    }

    get maxSlideScore(): number {
        return this._maxSlideScore;
    }

    get maxTotalScore(): number {
        return this._maxTotalScore;
    }

    get scoreBorderS(): number {
        return this._scoreBorderS;
    }

    get scoreBorderSS(): number {
        return this._scoreBorderSS;
    }

    get maxTotalAchievement(): number {
        return this._maxTotalAchievement;
    }
}
