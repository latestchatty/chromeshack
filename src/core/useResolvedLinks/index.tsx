import React, { useEffect, useState } from "react";
import type { ResolvedResponse } from "../../optional/media-embedder";
import { detectMediaLink, ParsedResponse } from "../api";
import { arrHas } from "../common";
import { Carousel } from "./Carousel";
import { Iframe, Image } from "./Components";
import { FlexVideo } from "./FlexVideo";
import type { MediaOptions, MediaProps } from "./index.d";

interface URLProps {
    link?: string;
    links?: string[];
    response?: ParsedResponse | ResolvedResponse;
    responses?: ResolvedResponse[];
    components?: JSX.Element[];
    options?: MediaOptions;
    key?: number | string;
}

interface ResolvedMediaProps {
    id?: string;
    className?: string;
    links: string[];
    options?: MediaOptions;
}

const loadComponent = (opts: URLProps) => {
    // takes a ParsedResponse and returns a rendered media component
    const { response, key } = opts || {};
    const { type } = (response as ParsedResponse) || {};
    let { options } = opts || {};
    let { src } = (response as ParsedResponse) || {};
    // override clickTogglesVisible for image components
    options = { ...options, clickTogglesVisible: type === "image" };
    // special case: normalize gifv to mp4 (imgur directmedia match)
    if (type === "video" && src && /imgur/.test(src)) src = src.replace(".gifv", ".mp4");
    // feed 'src' into an embeddable common media component depending on link type
    if (type === "image") return <Image key={key || src} src={src} options={options} />;
    else if (type === "video") return <FlexVideo key={key || src} src={src} {...options} />;
    else if (type === "iframe") return <Iframe key={key || src} src={src} />;
    else return null;
};

const resolveComponent = async (opts: URLProps): Promise<JSX.Element> => {
    // takes a ParsedResponse (usually from Expando or resolveLink) and returns a media component
    const { response, options } = opts || {};
    const { href, src, component, args, cb } = (response as ParsedResponse) || {};
    // if a component exists in the response or the callback result then return it
    const resolved = cb && (await cb(...args));
    if (React.isValidElement(component) || React.isValidElement(resolved?.component))
        return component || resolved?.component;
    // if we have a list of responses (Imgur) then load them into media components
    const aResolved =
        arrHas(resolved) && resolved[0].src
            ? (resolved as ParsedResponse[]).reduce((acc: JSX.Element[], r, i) => {
                  const _component = r?.src && loadComponent({ response: r, options, key: i.toString() });
                  if (React.isValidElement(_component)) acc.push(_component);
                  return acc;
              }, [])
            : null;
    if (arrHas(aResolved) && aResolved.length > 1) return <Carousel slides={aResolved} />;
    // edge case: Imgur single-media album
    else if (arrHas(aResolved)) return aResolved[0];
    // otherwise we load a component from our resolver
    else
        return resolved?.src || src
            ? loadComponent({ response: resolved || response, options, key: src || href })
            : null;
};
const resolveLink = async (opts: URLProps) => {
    const { link, options } = opts || {};
    const detected = typeof link === "string" && (await detectMediaLink(link));
    const resolved = detected && (await resolveComponent({ response: detected, options }));
    // if we're provided a component return it
    if (React.isValidElement(resolved) || React.isValidElement(detected?.component))
        return detected?.component || resolved;
    // otherwise load a media component from our response
    const pResolved = resolved as ParsedResponse;
    const rComponent = pResolved?.component && React.isValidElement(pResolved.component) ? pResolved.component : null;
    const lComponent = pResolved?.src ? loadComponent({ response: pResolved, options }) : null;
    return rComponent || lComponent;
};
const resolveAlbum = async (opts: URLProps) => {
    const { links, options } = opts || {};
    try {
        if (arrHas(links) && typeof links[0] !== "string") throw Error("resolveAlbum only resolves a list of strings!");
        // resolve urls into a list of media components
        const resolved = [] as JSX.Element[];
        for (const link of links || []) {
            const _resolved = await resolveLink({ link, options });
            if (React.isValidElement(_resolved)) resolved.push(_resolved);
        }
        // wrap media in a Carousel if necessary
        if (arrHas(resolved) && resolved.length > 1) return <Carousel slides={resolved} />;
        else if (arrHas(resolved)) return resolved[0];
        else return null;
    } catch (e) {
        console.error(e);
    }
};

export const resolveChildren = async (opts: URLProps) => {
    const { links, response, options } = opts || {};
    const cResolved = response && (await resolveComponent({ response, options }));
    const lResolved = arrHas(links) && resolveAlbum({ links, options });
    return cResolved || lResolved;
};
export const useResolvedLinks = (props: URLProps) => {
    // takes a url(s) or response(s) and exposes media component(s) and a load-state boolean
    const { links, response, options } = props || {};

    const [resolved, setResolved] = useState(null as JSX.Element);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            if (!hasLoaded) {
                const resolved = await resolveChildren({ links, response, options });
                if (resolved) {
                    setResolved(resolved);
                    setHasLoaded(true);
                }
            }
        })();
    }, [links, response, options, hasLoaded]);
    return { resolved, hasLoaded };
};
export const ResolveMedia = (props: ResolvedMediaProps) => {
    // use useResolvedLinks to return media components from a list of urls
    const { id, className, links, options } = props || {};
    const { resolved, hasLoaded } = useResolvedLinks({ links, options });
    return (
        <div id={id} className={className}>
            {hasLoaded ? resolved : <div />}
        </div>
    );
};

export { MediaProps, MediaOptions };
