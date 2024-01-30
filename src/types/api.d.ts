export {};

declare global {
  export type ParsedType = "image" | "video" | "iframe" | "iframe-short" | "instagram" | "twitter" | "chattypost";
  export interface ParsedResponse {
    src?: string;
    href?: string;
    type: ParsedType;
    args?: string[];
    cb?: (...args: string[]) => any;
    component?: JSX.Element;
    postid?: number;
    idx?: number;
  }

  export interface GfycatResponse {
    task?: string;
    gfyname?: string;
    code?: string;
    errorMessage?: {
      code?: string;
      description?: string;
    };
    gfyItem?: {
      webmUrl?: string;
      mobileUrl?: string;
    };
  }

  export interface ImgurResolution {
    imageId?: string;
    albumId?: string;
    galleryId?: string;
  }

  export type ImgurMediaItem = {
    mp4?: string;
    link?: string;
  };
  export interface ImgurResponse {
    data: {
      deletehash?: string;
      images?: ImgurMediaItem[];
      mp4?: string;
      link?: string;
    };
  }
  export interface ImgurCreateAlbumResponse {
    data: {
      id?: string;
      deletehash?: string;
    };
  }

  export interface ImgurSource {
    src: string;
    type: "image" | "video";
  }

  export interface ParsedChattyPost {
    postid: number;
    permalink: string;
    author: string;
    authorid: number;
    saneAuthor: string;
    icons: HTMLImageElement[];
    postbody: string;
    postdate: string;
  }
}
