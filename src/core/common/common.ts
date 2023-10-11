import lzString from "lz-string";

export const arrHas = (arr: any[]) => arr != null && Array.isArray(arr) && arr.length > 0;
export const arrEmpty = (arr: any[]) => arr !== null && Array.isArray(arr) && arr.length === 0;
export const objHas = (obj: Record<string, any>) =>
    obj != null && typeof obj === "object" && Object.keys(obj).length > 0;
export const objEmpty = (obj: Record<string, any>) =>
    obj != null && typeof obj === "object" && Object.keys(obj).length === 0;

export const objContainsProperty = (key: string, obj: Record<string, any>) =>
    objHas(obj) && Object.prototype.hasOwnProperty.call(obj, key);

export const isJSON = (text: string) => {
    try {
        if (text && JSON.parse(text)) return true;
    } catch (err) {
        return false;
    }
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
        } else if (typeof arg === "string" && arg !== null && arg) result.push(arg);

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

export const compressString = (input: string) => {
    try {
        return lzString.compressToUTF16(input);
    } catch (e) {
        console.error("Something went wrong when compressing:", e);
        return "";
    }
};
export const decompressString = (input: string) => {
    try {
        return lzString.decompressFromUTF16(input);
    } catch (e) {
        console.error("Something went wrong when decompressing:", e, input);
        return "";
    }
};

export const timeOverThresh = (timestamp: number, threshold: number) => {
    // returns the current time if over a given threshold (in miliseconds)
    const now = Date.now();
    const diffTime = Math.abs(now - timestamp);
    if (diffTime > threshold) return now;
    else return false;
};

export const getCurrentTabId = async () => {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab.id;
}

export const isFirefox = () => {
    // @ts-ignore
    return typeof InstallTrigger !== "undefined";
}
