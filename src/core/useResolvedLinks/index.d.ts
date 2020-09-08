interface FlexVideoOptionsProps {
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    autoPlay?: boolean;
    clickTogglesPlay?: boolean;
}

interface ImageOptionsProps {
    clickTogglesVisible?: boolean;
    toggleHandler?: () => void;
}

export type MediaOptions = FlexVideoOptionsProps & ImageOptionsProps;

export interface MediaProps extends MediaOptions {
    src: string;
    id?: string;
    classes?: string;
    links?: string[];
    options?: MediaOptions;
}

export interface ResolvedLinkProps {
    link?: string;
    links?: string[];
    options?: MediaOptions;
}

export interface HTMLVideoElementWithAudio extends HTMLVideoElement {
    mozHasAudio?: boolean;
    webkitAudioDecodedByteCount?: number;
}

export interface OverlayProps {
    visibility: boolean;
    predicate: boolean;
    onClick: () => void;
    audioEnabled?: boolean;
}

export interface IntersectionObserverConfig {
    root?: HTMLElement;
    threshold: number[] | number;
    [x: string]: any;
}
