
export function getBeatsPerSecond(bpm: number) {
    return bpm / 60;
}

export function getSecondsPerBeat(bpm: number) {
    const bps = getBeatsPerSecond(bpm);
    return 1 / bps;
}
