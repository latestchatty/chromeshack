export const getRandomNum = (min: number, max: number, precision?: number) =>
    parseFloat((Math.random() * (max - min) + min).toPrecision(precision ? precision : 1));

// https://stackoverflow.com/a/25873123
export const randomHsl = () => `hsla(${getRandomNum(0, 360)}, ${getRandomNum(25, 100)}%, ${getRandomNum(35, 60)}%, 1)`;

export const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (Math.ceil(max) - Math.floor(min))) + Math.ceil(min);

export const trimName = (name: string) =>
    name
        .trim()
        .replace(/[\W\s]+/g, "")
        .toLowerCase();

export const cssStrToProps = (css: string): Record<any, string> => {
    if (!css || typeof css !== "string") return {};
    let styleProps = {};
    const rules = css.split(";");
    if (rules)
        rules.map((r, _, arr) => {
            let [key, val] = r?.split(":");
            key = key && (key.trim() as string);
            val = val && (val.trim() as string);
            // if we already have this key then replace it
            const keyIdx = arr.findIndex((i) => i === key);
            if (keyIdx > -1) arr.splice(keyIdx);
            const _key = key?.replace(/-[a-z]/g, (m) => m[1].toUpperCase()) || key;
            const _val = val?.replace(/ !important/g, "") || val;
            if (_key && _val) styleProps = { ...styleProps, [_key]: _val };
        });
    return styleProps;
};

export const objConditionalFilter = (disallowed: string[], obj: Record<string, any>) => {
    return Object.keys(obj)
        .filter((k) => !disallowed.includes(k))
        .reduce((o, k) => {
            return { ...o, [k]: obj[k] };
        }, {});
};

export const copyToClipboard = (textArea: HTMLTextAreaElement, exportable: string) => {
    const _textArea = textArea?.nodeName === "TEXTAREA" ? (textArea as HTMLTextAreaElement) : null;
    if (_textArea && exportable?.length > 0) {
        _textArea.select();
        document.execCommand("copy");
        return true;
    } else return false;
};
