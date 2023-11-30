export {};

declare global {
  export interface ResolvedResponse {
    postid?: number;
    idx?: number;
    response: ParsedResponse;
  }

  export interface ExpandoProps extends ResolvedResponse {
    options?: MediaOptions;
  }

  interface FlexVideoOptionsProps {
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    autoPlay?: boolean;
    clickTogglesPlay?: boolean;
  }

  interface IframeOptionsProps {
    openByDefault?: boolean;
  }

  interface ImageOptionsProps {
    clickTogglesVisible?: boolean;
    toggleHandler?: () => void;
  }

  export type MediaOptions = FlexVideoOptionsProps &
    IframeOptionsProps &
    ImageOptionsProps;

  export interface MediaProps extends MediaOptions {
    src: string;
    id?: string;
    classes?: string;
    links?: string[];
    options?: MediaOptions;
  }

  export interface URLProps {
    link?: string;
    links?: string[];
    response?: ParsedResponse | ResolvedResponse;
    responses?: ResolvedResponse[];
    components?: JSX.Element[];
    options?: MediaOptions;
    key?: number | string;
    toggled?: boolean;
  }

  export interface ResolvedMediaProps {
    id?: string;
    className?: string;
    links: string[];
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

  export interface IntersectionObserverConfig extends IntersectionObserverInit {
    delay?: number[] | number;
    trackVisibility?: boolean;
  }
}
