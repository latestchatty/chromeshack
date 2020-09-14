import React, { useEffect, useState, useRef } from "react";

import { arrHas, objHas, isIframe, classNames } from "../common";
import { ParsedResponse, detectMediaLink } from "../api";

import { Carousel } from "../../optional/media-embedder/Carousel";
import { FlexVideo } from "./FlexVideo";

import type { ResolvedLinkProps, MediaProps, MediaOptions } from "./index.d";

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
    const { classes: _classes, src, options } = props || {};
    const [classes, setClasses] = useState("");
    const [isSlide, setIsSlide] = useState(false);
    const imageRef = useRef<HTMLImageElement>();
    // click-to-toggle enabled by default
    const { clickTogglesVisible = true } = options || {};

    useEffect(() => {
        const img = imageRef.current;
        const _isSlide = img?.closest(".embla__slide__inner");
        if (img && _isSlide) {
            setIsSlide(!!_isSlide);
            // disable click-to-toggle pointer if we're a child of a slide
            setClasses(classNames(_classes));
        } else if (img) {
            setClasses(classNames(_classes, { canToggle: clickTogglesVisible }));
        }
    }, [imageRef, isSlide, _classes, clickTogglesVisible]);

    return src && <img className={classes} src={src} alt="" ref={imageRef} />;
};

const loadComponent = (response: ParsedResponse, options?: MediaOptions) => {
    const { type } = response || {};
    let { src } = response || {};
    // special case: normalize gifv to mp4 (imgur directmedia match)
    if (type === "video" && src && /imgur/.test(src)) src = src.replace(".gifv", ".mp4");
    // feed 'src' into an embeddable common media component depending on link type
    if (type === "image") return <Image key={src} src={src} options={options} />;
    else if (type === "video") return <FlexVideo key={src} src={src} {...options} />;
    else if (type === "iframe") return <Iframe key={src} src={src} />;
    else return null;
};
const loadCarousel = (resolved: ParsedResponse[]) => {
    if (arrHas(resolved) && resolved.length > 1) {
        // if our media comes in an array reduce to rendered components
        const children = resolved.reduce((acc, v) => {
            const { src: resolvedSrc, type: resolvedType } = v || {};
            const response = { key: resolvedSrc, src: resolvedSrc, type: resolvedType };
            const rendered = objHas(response) && loadComponent(response);
            if (rendered) acc.push(rendered);
            return acc;
        }, [] as React.ReactNode[]);
        // pack them into a Carousel container for a better user experience
        if (arrHas(children)) return <Carousel slides={children} />;
    }
    return null;
};
const resolveLink = async (opts: {
    link?: string;
    fallbackLink?: string;
    options?: MediaOptions;
}): Promise<JSX.Element> => {
    const { link, fallbackLink, options } = opts || {};
    const _link = link ? link : fallbackLink;
    // grab a link resolver object from the url given to us
    const parsed = await detectMediaLink(_link);
    // rename our initial result for normal media types to avoid conflicts later
    const { src: normalSrc, args, cb, type: normalType } = parsed || {};
    // if our resolver object contains a callback then use it
    const resolver = args ? await cb(...args) : null;
    // return a rendered Carousel containing our media
    const carouselChildren = arrHas(resolver) && loadCarousel(resolver);
    if (carouselChildren) return carouselChildren;
    // use the rendered component if it exists in our resolver object
    if (resolver?.component) return resolver.component;
    // pack our resolver results into a format our loader understands
    const _src = (resolver && resolver[0].src) || resolver?.src || normalSrc;
    const _type = (resolver && resolver[0].type) || resolver?.src || normalType;
    const resolved = _src ? { key: _src, src: _src, type: _type } : null;
    return resolved ? loadComponent(resolved, options) : null;
};
const resolveLinks = async (links: string[], options?: MediaOptions) => {
    // process each link in our list then reduce into a rendered component
    const _resolved = arrHas(links)
        ? await links.reduce(async (acc: Promise<React.ReactNode[]>, l) => {
              const resolving = await resolveLink({ link: l, options });
              const _acc = await acc;
              if (resolving) _acc.push(resolving);
              return _acc;
          }, Promise.resolve([]))
        : null;
    // wrap with a Carousel container if appropriate
    if (arrHas(_resolved) && _resolved.length > 1) return <Carousel slides={_resolved} />;
    else if (_resolved?.length === 1) return _resolved[0] as JSX.Element;
    else return null;
};

export const useResolvedLinks = (props: ResolvedLinkProps) => {
    /// returns a rendered component after resolving its associated media link(s)
    const { link, links, options } = props || {};
    const [resolved, setResolved] = useState(null as JSX.Element);

    useEffect(() => {
        (async () => {
            const children: JSX.Element = arrHas(links) ? await resolveLinks(links, options) : null;
            const child: JSX.Element = link ? await resolveLink({ fallbackLink: link, options }) : null;
            setResolved(children || child);
        })();
    }, [link, links, options]);
    // return rendered media embeds as components
    return resolved && <>{resolved}</>;
};

export { MediaProps };
