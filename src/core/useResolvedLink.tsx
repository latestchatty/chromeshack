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
    src: string;
    postid?: string;
    idx?: string;
    classes?: string;
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
    const { postid, idx, src, isSlide } = props || {};
    if (!src) return null;

    const iframeType = isIframe(src);
    const isTwitch = iframeType && iframeType === "twitch";
    const isYoutube = iframeType && iframeType === "youtube";
    const isGeneric = iframeType && !isTwitch && !isYoutube;
    const id = `iframe_${postid}-${idx}`;
    const classes = classNames({
        "iframe-slide": isSlide,
        "iframe-container": isGeneric,
        "twitch-container": isTwitch,
        "yt-container": isYoutube,
    });
    return (
        <div id={id} className={classes}>
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
    const { postid, idx, classes, src } = props || {};
    let { loop, muted, controls, autoPlay, pauseOnClick } = props || {};
    const id = `video_${postid}-${idx}`;
    const videoRef = useRef<HTMLVideoElement>(null);
    // provide an visibility observer for use in carousel mode
    /* const observerOptions = {
        delay: 500,
        trackVisibility: true,
        threshold: [0, 0.95],
    };
    const visibilityObserver = new IntersectionObserver((changes) => {
        for (const c of changes) {
            const elem = c.target?.matches("video") && (c.target as HTMLVideoElement);
            if (c.intersectionRatio >= 0.95 && elem) elem.play();
            else if (elem) elem.pause();
        }
    }, observerOptions); */

    // set some sensible defaults
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
            key={idx}
            ref={videoRef}
            id={id}
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
    const { postid, idx, classes, src } = props || {};
    const id = `image_${postid}-${idx}`;
    if (!src) return null;
    return <img id={id} className={classes} src={src} alt="" />;
};

interface ResolvedLinkProps {
    link: string;
    postid?: string;
    idx?: string;
    options?: MediaLinkOptions;
}
const useResolvedLink = (props: ResolvedLinkProps) => {
    const { link, postid, idx, options } = props || {};
    /// returns a rendered component after resolving its associated media
    const [resolved, setResolved] = useState(null);
    // provide access to video props for native embeds
    const { muted, loop, controls, autoPlay } = options || {};

    const loadComponent = (response: ParsedResponse, slide?: boolean) => {
        let { src } = response || {};
        const { type, postid, idx } = response || {};
        // special case: normalize gifv to mp4 (imgur directmedia match)
        if (type === "video" && /imgur/.test(src) && src) src = src.replace(/\.gifv/, ".mp4");
        // feed 'src' into an embeddable common media component depending on link type
        if (type === "image") return <Image key={src} postid={postid} idx={idx} src={src} />;
        else if (type === "video")
            return (
                <Video
                    key={src}
                    postid={postid}
                    idx={idx}
                    src={src}
                    loop={loop}
                    muted={muted}
                    controls={controls}
                    autoPlay={autoPlay}
                    isSlide={slide}
                />
            );
        else if (type === "iframe") return <Iframe key={src} postid={postid} idx={idx} src={src} />;
        else return <div />;
    };

    useEffect(() => {
        (async () => {
            const parsed = await detectMediaLink(link);
            const { src: normalSrc, args, cb, type: normalType } = parsed || {};
            const resolver = args ? await cb(...args) : null;
            if (arrHas(resolver) && resolver.length > 1) {
                // if our media comes in an array return some carousel slides
                const children = resolver.reduce((acc: React.ReactNode[], v: ParsedResponse) => {
                    const { src: resolvedSrc, type: resolvedType } = v || {};
                    const response = { key: resolvedSrc, src: resolvedSrc, type: resolvedType, postid, idx };
                    const rendered = objHas(response) && loadComponent(response);
                    if (rendered) acc.push(rendered);
                    return acc;
                }, []) as React.ReactNode[];
                // pack them into a Carousel component for a better user experience
                if (arrHas(children)) setResolved(<Carousel slides={children} />);
            } else {
                // catch a single image gallery case (Imgur silliness)
                const _src = arrHas(resolver)
                    ? resolver[0].src
                    : normalSrc
                    ? normalSrc
                    : resolver.src
                    ? resolver.src
                    : null;
                const _type = arrHas(resolver)
                    ? resolver[0].type
                    : normalType
                    ? normalType
                    : resolver.type
                    ? resolver.type
                    : null;
                const resolved = _src && _type ? { key: _src, src: _src, type: _type, postid, idx } : null;
                // pass along a rendered component otherwise render using 'src'
                if (resolver?.component) setResolved(resolver.component);
                else if (resolved?.src) {
                    const component = loadComponent(resolved);
                    if (component) setResolved(component);
                }
            }
        })();
    }, []);
    // return rendered media embeds as components
    return resolved;
};

export default useResolvedLink;
