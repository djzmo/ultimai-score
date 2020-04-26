
export default class MaidataParser {
    private items: Map<string, string>;

    constructor(data) {
        this.items = this.load(data);
    }

    getString(key: string) {
        const value = this.items.get(key);
        return value != null && value.length === 0 ? undefined : value;
    }

    getNumber(key: string) {
        const stringValue = this.items.get(key);
        if (stringValue != null) {
            const numberValue = parseFloat(stringValue);
            return isNaN(numberValue) ? undefined : numberValue;
        }
        return undefined;
    }

    private load(data: string) {
        const resultMap = new Map<string, string>();
        let rows = data.split("\n");
        rows.forEach((value: string, index: number) => rows[index] = value.trim());
        rows = rows.filter(str => str.length > 0);
        let returnValue: string | null = null;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.charAt(0) !== '&') {
                continue;
            }

            const equalPos = row.indexOf('=');
            if (equalPos === -1) {
                continue;
            }

            const key = row.substring(row.indexOf('&') + 1, equalPos).trim();
            let value = row.substring(equalPos + 1).trim();
            if (key.startsWith('inote_')) {
                value = value.replace(/\s+/g, '').trim();
                if (value.toLowerCase() !== 'e') {
                    if (value.startsWith('||')) {
                        value = '';
                    }

                    while (i < rows.length - 1) {
                        let nextRow = rows[++i].replace(/\s+/g, '').trim();
                        if (nextRow.toLowerCase() === 'e' || (nextRow.charAt(0) === '&' && value.length === 0)) {
                            if (nextRow.charAt(0) === '&') {
                                i--;
                            }

                            break;
                        } else if (nextRow.startsWith('||')) {
                            continue;
                        }

                        value += nextRow;
                    }
                }
            }

            resultMap.set(key, value);
        }

        return resultMap;
    }
}