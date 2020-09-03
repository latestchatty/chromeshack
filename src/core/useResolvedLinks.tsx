import React, { useEffect, useRef, useState } from "react";

import { arrHas, objHas, isIframe, classNames } from "./common";
import { ParsedResponse, detectMediaLink } from "./api";

import Carousel from "../optional/media-embedder/Carousel";

import type { MediaLinkOptions } from "../optional/media-embedder";

declare module "react" {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        // suppress warning on scale attribute for iframes
        scale?: string;
    }
}

interface MediaProps {
    id?: string;
    classes?: string;
    src: string;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    autoPlay?: boolean;
    pauseOnClick?: boolean;
    isSlide?: boolean;
    links?: string[];
}

const isVidPlaying = (v: HTMLVideoElement) => !!(v.currentTime > 0 && !v.paused && !v.ended && v.readyState > 2);

export const Iframe = (props: MediaProps) => {
    const { src } = props || {};
    if (!src) return null;

    const iframeType = isIframe(src);
    const isTwitch = iframeType && iframeType === "twitch";
    const isYoutube = iframeType && iframeType === "youtube";
    const isGeneric = iframeType && !isTwitch && !isYoutube;
    const classes = classNames({
        "iframe-container": isGeneric,
        "twitch-container": isTwitch,
        "yt-container": isYoutube,
    });
    return (
        <div className={classes}>
            <iframe
                title={src}
                src={src}
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                allow={isYoutube ? "autoplay; encrypted-media" : ""}
                scale={isGeneric ? "tofit" : ""}
            />
        </div>
    );
};
export const Video = (props: MediaProps) => {
    const { classes, src } = props || {};
    const videoRef = useRef<HTMLVideoElement>(null);

    // set some sensible defaults
    let { loop, muted, controls, autoPlay, pauseOnClick } = props || {};
    if (loop === undefined) loop = true;
    if (muted === undefined) muted = true;
    if (controls === undefined) controls = false;
    if (autoPlay === undefined) autoPlay = true;
    if (pauseOnClick === undefined) pauseOnClick = true;

    const onClick = (e: React.MouseEvent<HTMLVideoElement, MouseEvent>) => {
        e.preventDefault();
        if (pauseOnClick) {
            const vid = videoRef.current;
            if (vid && isVidPlaying(vid)) vid.pause();
            else if (vid) vid.play();
        }
    };

    return (
        <video
            key={src}
            ref={videoRef}
            className={classes}
            src={src}
            loop={loop}
            muted={muted}
            controls={controls}
            autoPlay={autoPlay}
            onClick={onClick}
        />
    );
};
export const Image = (props: MediaProps) => {
    const { classes, src } = props || {};
    if (!src) return null;
    return <img className={classes} src={src} alt="" />;
};

interface ResolvedLinkProps {
    link?: string;
    links?: string[];
    options?: MediaLinkOptions;
}
const useResolvedLinks = (props: ResolvedLinkProps) => {
    /// returns a rendered component after resolving its associated media link
    const { link, links, options } = props || {};
    // provide access to video props for native embeds
    const { muted, loop, controls, autoPlay } = options || {};
    const [resolved, setResolved] = useState(null as React.ReactNode);

    const loadComponent = (response: ParsedResponse) => {
        let { src } = response || {};
        const { type } = response || {};
        // special case: normalize gifv to mp4 (imgur directmedia match)
        if (type === "video" && /imgur/.test(src) && src) src = src.replace(/\.gifv/, ".mp4");
        // feed 'src' into an embeddable common media component depending on link type
        if (type === "image") return <Image key={src} src={src} />;
        else if (type === "video")
            return <Video key={src} src={src} loop={loop} muted={muted} controls={controls} autoPlay={autoPlay} />;
        else if (type === "iframe") return <Iframe key={src} src={src} />;
        // ... just return an empty div otherwise
        else return <div />;
    };

    useEffect(() => {
        const resolveLink = async (l?: string) => {
            const _link = l ? l : link;
            const parsed = await detectMediaLink(_link);
            const { src: normalSrc, args, cb, type: normalType } = parsed || {};
            const resolver = args ? await cb(...args) : null;
            if (arrHas(resolver) && resolver.length > 1) {
                // if our media comes in an array return a carousel (Imgur)
                const children = resolver.reduce((acc: React.ReactNode[], v: ParsedResponse) => {
                    const { src: resolvedSrc, type: resolvedType } = v || {};
                    const response = { key: resolvedSrc, src: resolvedSrc, type: resolvedType };
                    const rendered = objHas(response) && loadComponent(response);
                    if (rendered) acc.push(rendered);
                    return acc;
                }, []) as React.ReactNode[];
                // pack them into a Carousel component for a better user experience
                if (arrHas(children)) return <Carousel slides={children} />;
            } else {
                // pass along a rendered component if provided
                if (resolver?.component) return resolver.component;
                // catch a single image gallery case (Imgur silliness)
                const _src = arrHas(resolver)
                    ? resolver[0].src
                    : normalSrc
                    ? normalSrc
                    : resolver?.src
                    ? resolver.src
                    : null;
                const _type = arrHas(resolver)
                    ? resolver[0].type
                    : normalType
                    ? normalType
                    : resolver?.type
                    ? resolver.type
                    : null;
                const resolved = _src && _type ? { key: _src, src: _src, type: _type } : null;
                if (resolved?.src) return loadComponent(resolved);
            }
        };
        const resolveLinks = async () => {
            const _resolved = await links.reduce(async (acc, l) => {
                const _acc = await acc;
                const resolving = await resolveLink(l);
                //console.log("resolveLinks accumulator:", resolving, l, _acc);
                if (resolving) _acc.push(resolving);
                return Promise.resolve(_acc);
            }, Promise.resolve([]) as Promise<React.ReactNode[]>);
            // wrap with a Carousel if necessary
            if (arrHas(_resolved) && _resolved.length > 1) return <Carousel slides={_resolved} />;
            else if (_resolved?.length === 1) return _resolved[0];
        };

        if (arrHas(links)) resolveLinks().then(setResolved);
        else resolveLink().then(setResolved);
    }, []);
    // return rendered media embeds as components
    return resolved;
};

export default useResolvedLinks;
