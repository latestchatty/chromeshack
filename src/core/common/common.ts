export const arrHas = (arr: any[]) => arr && Array.isArray(arr) && arr.length > 0;
export const arrEmpty = (arr: any[]) => arr && Array.isArray(arr) && arr.length === 0;
export const objHas = (obj: Record<string, any>) => obj && typeof obj === "object" && Object.keys(obj).length > 0;
export const objEmpty = (obj: Record<string, any>) => obj && typeof obj === "object" && Object.keys(obj).length === 0;

export const objContains = (needle: any, haystack: any) => {
    /// tests for object equality in a nested object
    if (!haystack || arrEmpty(haystack as string[]) || objEmpty(haystack as Record<string, any>)) return null;
    if (needle === haystack) return needle as string;
    else if (arrHas(haystack as string[])) return (haystack as string[]).find((x) => x === needle) || null;
    for (const k of Object.keys(haystack as Record<string, any>) || []) {
        const value = haystack[k];
        if (arrHas(value) || typeof value === "object") {
            const result = objContains(needle, value) as string;
            if (result) return result;
        } else if (value === needle) {
            return value;
        }
    }
    return null;
};

export const objContainsProperty = (key: string, obj: Record<string, any>) =>
    obj && Object.prototype.hasOwnProperty.call(obj, key);

export const isJSON = (text: string) => {
    try {
        if (text && JSON.parse(text)) return true;
    } catch (err) {
        return false;
    }
};

export const isHTML = (text: string) => {
    // https://stackoverflow.com/a/15458968
    if (!text || (text && isJSON(text))) return false;
    const doc = new DOMParser().parseFromString(text, "text/html");
    return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
};

export const classNames = (...args: any[]) => {
    /// pass a string or object to assemble classes based on truthiness
    /// e.g.: classNames("a", { very: true, convenient: true, function: false });
    /// produces: "a very convenient"
    const result = [];
    for (const arg of args)
        if (typeof arg === "object" && arg !== null) {
            const keys = Object.keys(arg);
            for (const k of keys) if (arg[k]) result.push(k);
        } else if (typeof arg === "string" && arg !== null && arg) {
            result.push(arg);
        }

    return !arrEmpty(result) ? result.join(" ") : "";
};

export const isVideo = (href: string) => /\.?(mp4|gifv|webm|mov)/i.test(href);
export const isImage = (href: string) => /\.?(jpe?g|gif(?!v)|png|webp)/i.test(href);
export const isIframe = (href: string) => {
    if (/youtu(\.be\/|be\.\w+\/)/.test(href)) return "youtube";
    else if (/twitch\.tv/.test(href)) return "twitch";
    else if (/streamable\.com/.test(href)) return "streamable";
    else if (/xboxdvr\.com/.test(href)) return "xboxdvr";
    else return null;
};
export const getLinkType = (href: string) => {
    const _isImage = isImage(href) ? "image" : null;
    const _isVideo = isVideo(href) ? "video" : null;
    const _isIframe = isIframe(href) ? "iframe" : null;
    const _isInstagram = /instagr\.am|instagram\./i.test(href) ? "instagram" : null;
    const _isTwitter = /twitter\./i.test(href) ? "twitter" : null;
    const _isChattypost = /shacknews\.com\/chatty\?id=\d+/i.test(href) ? "chattypost" : null;
    return _isImage || _isVideo || _isIframe || _isInstagram || _isTwitter || _isChattypost;
};

export const isUrlArr = (dataArr: string[]) => {
    // every element of this array must contain a URL formatted string
    for (const i of dataArr || [])
        if (typeof i !== "string" || i.length <= 9 || !i.match(/^https?:\/\//i)) return false;

    return true;
};

export const isFileArr = (dataArr: any[]) => {
    // every element of this array must contain a File object
    for (const i of dataArr || []) if (!(i instanceof File)) return false;
    return true;
};

export const getFileCount = (fileList: FileList | File[]) => {
    const files = typeof fileList === "object" && !Array.isArray(fileList) ? [...fileList] : fileList;
    return files && files.length > 0 ? `${files.length} files` : "";
};

export const packValidTypes = (types: string, fileList: File[] | FileList) => {
    /// only include files that match a mime type list
    // a string with comma delimited mime types
    const typeArr = types.split(",");
    // returns a File array with only matching file types in it
    return [...fileList].filter((f) => typeArr.includes(f.type));
};
