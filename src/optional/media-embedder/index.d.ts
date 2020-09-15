import type { ParsedResponse } from "../../core/api";

export interface ExpandoProps {
    response: ParsedResponse;
    idx: string;
    postid?: string;
}

export interface FCWithMediaProps extends JSX.Element {
    props: {
        src?: string;
        slides?: JSX.Element[];
    };
}
