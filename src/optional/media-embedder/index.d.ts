import type { FlexVideoProps } from "../../core/useResolvedLinks";

export interface ExpandoProps extends FlexVideoProps {
    link: HTMLAnchorElement;
    idx: string;
    postid?: string;
    options?: FlexVideoProps;
}

export interface FCWithMediaProps extends JSX.Element {
    props: {
        src?: string;
    };
}
