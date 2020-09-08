import React, { useEffect, useState } from "react";

import { arrHas, objHas, isIframe, classNames } from "../common";
import { ParsedResponse, detectMediaLink } from "../api";

import Carousel from "../../optional/media-embedder/Carousel";
import FlexVideo from "./FlexVideo";

import type { ResolvedLinkProps, MediaProps } from "./index.d";

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
        <div className="iframe__boundary">
            <div className={classes}>
                <iframe
                    title={src}
                    src={src}
                    frameBorder="0"
                    scrolling="no"
                    allowFullScreen
                    allow={isYoutube ? "autoplay; encrypted-media" : ""}
                />
            </div>
        </div>
    );
};

export const Image = (props: MediaProps) => {
    const { classes, src, options } = props || {};
    if (!src) return null;

    let { clickTogglesVisible } = options || {};
    // click-to-toggle enabled by default
    if (clickTogglesVisible === undefined) clickTogglesVisible = true;
    const _classes = clickTogglesVisible ? classNames(classes, { canToggle: clickTogglesVisible }) : classes;

    return (
        <div className="media__boundary">
            <img className={_classes} src={src} alt="" />
        </div>
    );
};

const useResolvedLinks = (props: ResolvedLinkProps) => {
    /// returns a rendered component after resolving its associated media link(s)
    const { link, links, options } = props || {};
    const [resolved, setResolved] = useState(null as JSX.Element);

    useEffect(() => {
        const loadComponent = (response: ParsedResponse) => {
            const { type } = response || {};
            let { src } = response || {};
            // special case: normalize gifv to mp4 (imgur directmedia match)
            if (type === "video" && src && /imgur/.test(src)) src = src.replace(".gifv", ".mp4");
            // feed 'src' into an embeddable common media component depending on link type
            if (type === "image") return <Image key={src} src={src} options={options} />;
            else if (type === "video") {
                return <FlexVideo key={src} src={src} {...options} />;
            } else if (type === "iframe") return <Iframe key={src} src={src} />;
            else return null;
        };
        const resolveLink = async (l?: string) => {
            const _link = l ? l : link;
            // grab a link resolver object from the url given to us
            const parsed = await detectMediaLink(_link);
            // rename our initial result for normal media types to avoid conflicts later
            const { src: normalSrc, args, cb, type: normalType } = parsed || {};
            // if our resolver object contains a callback then use it
            const resolver = args ? await cb(...args) : null;
            if (arrHas(resolver) && resolver.length > 1) {
                // if our media comes in an array reduce to rendered components
                const children = resolver.reduce((acc: React.ReactNode[], v: ParsedResponse) => {
                    const { src: resolvedSrc, type: resolvedType } = v || {};
                    const response = { key: resolvedSrc, src: resolvedSrc, type: resolvedType };
                    const rendered = objHas(response) && loadComponent(response);
                    if (rendered) acc.push(rendered);
                    return acc;
                }, []) as React.ReactNode[];
                // pack them into a Carousel container for a better user experience
                if (arrHas(children)) return <Carousel slides={children} />;
            } else {
                // use the rendered component if it exists in our resolver object
                if (resolver?.component) return resolver.component;
                // pack our resolver results into a format our loader understands
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
            // process each link in our list then reduce into a rendered component
            const _resolved = await links.reduce(async (acc, l) => {
                const _acc = await acc;
                const resolving = await resolveLink(l);
                if (resolving) _acc.push(resolving);
                return Promise.resolve(_acc);
            }, Promise.resolve([]) as Promise<React.ReactNode[]>);
            // wrap with a Carousel container if appropriate
            if (arrHas(_resolved) && _resolved.length > 1) return <Carousel slides={_resolved} />;
            else if (_resolved?.length === 1) return _resolved[0];
        };

        if (arrHas(links)) resolveLinks().then(setResolved);
        else resolveLink().then(setResolved);
    }, []);
    // return rendered media embeds as components
    return resolved;
};

export { MediaProps };
export default useResolvedLinks;
