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

const resolveResponse = async (opts: URLProps) => {
    // takes a ParsedResponse (usually from Expando or resolveLink) and returns a media component
    const { response, options } = opts || {};
    const { href, src, component, args, cb } = (response as ParsedResponse) || {};
    // if a component exists in the response or the callback result then return it
    const resolved = cb && (await cb(...args));
    if (React.isValidElement(component) || React.isValidElement(resolved?.component))
        return component || resolved?.component;
    // if the resolver callback returns an array of links just return them
    else if (arrHas(resolved)) return resolved;
    // otherwise we just return a component from the provided 'src' in the ParsedResponse
    else
        return resolved?.src || src
            ? loadComponent({ response: resolved || response, options, key: src || href })
            : null;
};
const resolveLink = async (opts: URLProps) => {
    // takes either a url or a ParsedResponse and resolves its async callback
    const { link, response, options, key } = opts || {};
    const detected = link && (await detectMediaLink(link));
    const _response = (response as ParsedResponse) || detected;
    const resolved = _response?.cb ? await resolveResponse({ response: _response, options }) : _response;
    const component = React.isValidElement(resolved)
        ? resolved
        : resolved?.src
        ? loadComponent({ response: resolved, options, key })
        : null;
    return component || null;
};
const resolveLinks = async (opts: URLProps) => {
    // takes urls or ResolvedResponses and resolves them into a list of media components
    const { links, responses, options } = opts || {};
    // otherwise try to resolve into media components
    const resolvedSources: JSX.Element[] = arrHas(links)
        ? await links.reduce(async (acc: Promise<JSX.Element[]>, l, i) => {
              // we assume our link is a direct media url
              const resolved = await resolveLink({ link: l, options });
              const _acc = await acc;
              if (resolved) _acc.push(resolved);
              return _acc;
          }, Promise.resolve([]))
        : null;
    const resolvedResponses: JSX.Element[] = arrHas(responses)
        ? await responses.reduce(async (acc: Promise<JSX.Element[]>, r, i) => {
              const resolved = await resolveResponse({ response: r, options, key: i });
              const _acc = await acc;
              if (resolved) _acc.push(resolved);
              return _acc;
          }, Promise.resolve([]))
        : null;
    return resolvedSources || resolvedResponses;
};
const resolveAlbum = async (opts: URLProps) => {
    const { links, responses, components, options } = opts || {};
    // don't try to resolve an existing list of media components
    const _components = arrHas(components) && React.isValidElement(components[0]) ? components : null;
    if (arrHas(_components)) return <Carousel slides={_components} />;
    // since we've got either a list of links or response objects let's resolve them
    const slides = arrHas(links)
        ? await resolveLinks({ links, options })
        : arrHas(responses)
        ? await resolveLinks({ responses, options })
        : null;
    // return a Carousel if we have enough slides
    // edge case: return the first component in case of Imgur single-item albums
    return arrHas(slides) && slides.length > 1 ? <Carousel slides={slides} /> : arrHas(slides) ? slides[0] : null;
};

export const resolveChildren = async (opts: URLProps) => {
    const { links, response, options } = opts || {};
    const rResolved = response && (await resolveResponse({ response, options }));
    const lResolved = links && (await resolveLinks({ links, options }));
    // return a media component(s) from our resolved results
    const _component = React.isValidElement(rResolved) ? rResolved : React.isValidElement(lResolved) ? lResolved : null;
    // otherwise attempt to resolve into a media component
    const _album =
        arrHas(lResolved) && React.isValidElement(lResolved[0])
            ? lResolved
            : arrHas(rResolved) && !React.isValidElement(rResolved)
            ? rResolved
            : arrHas(lResolved) && !React.isValidElement(lResolved)
            ? lResolved
            : null;
    if (_album) {
        const resolved = !React.isValidElement(_album[0])
            ? await resolveAlbum({ responses: _album })
            : (await resolveAlbum({ components: _album })) || null;
        return React.isValidElement(resolved) ? resolved : null;
    } else if (_component) {
        return _component;
    }
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
