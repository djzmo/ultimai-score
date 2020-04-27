import isNumber from "is-number";

export function isButtonPosition(item: string) {
    const position = Number(item);
    return isNumber(position) && position >= 1 && position <= 8;
}

export function isTouchPosition(item: string) {
    const left = item.charAt(0);
    const right = item.length > 1 ? item.charAt(1) : '';
    return (right.length === 0 && left === 'C') ||
        ('ABDE'.includes(left) && isButtonPosition(right));
}

export function shiftPosition(value: string, amount: number, direction: -1 | 1 = 1) {
    const shift = (n, m) => {
        const result = direction > 0 ? n + m : n - m;
        if (result > 8) {
            return result % 8;
        } else if (result < 1) {
            return result + 8;
        }
        return result;
    };

    if (!isNumber(value) && value.length === 2 && isNumber(value.charAt(1))) {
        const left = value.charAt(0);
        const right = value.charAt(1);
        return left + shift(Number(right), amount);
    } else if (isNumber(value)) {
        return shift(Number(value), amount);
    } else {
        return value;
    }
}

export function calculateDistance(a: number, b: number) {
    if (a === b) {
        return 0;
    }
    const low = a < b ? a : b;
    const high = a > b ? a : b;
    const shortest = Math.min(high - low, low + 8 - high);
    return Math.abs(shortest);
}
