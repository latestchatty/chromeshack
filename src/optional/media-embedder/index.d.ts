import type { ParsedResponse } from "../../core/api";
import type { MediaOptions } from "../../core/useResolvedLinks";

export interface ExpandoProps {
    response: ParsedResponse;
    idx: string;
    postid?: string;
    options?: MediaOptions;
}

export interface FCWithMediaProps extends JSX.Element {
    props: {
        src?: string;
        slides?: JSX.Element[];
    };
}
