import { isImage, isVideo } from "../common/common";

const parseLink = (href: string) => {
    // https://www.shacknews.com/chatty?id=42133811#item_42133811
    // https://www.shacknews.com/chatty?id=42083193#item_42083193
    // https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuyqW9Ji3PNjm97jZw2B3q18_vUWoAPfzD8g&usqp=CAU
    // https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2dGlhF4jRBG7_ZuQvNgPyMU4ePky65bUCgg&usqp=CAU
    const isGstatic = /(https?:\/\/(?:.+\.)?gstatic\.com\/images\?q=.+)/i.exec(href);
    const src = isGstatic?.[1];
    return src ? ({ type: "image", href, src } as ParsedResponse) : null;
};

export const isGstatic = (href: string) => parseLink(href);
