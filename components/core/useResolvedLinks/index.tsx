import { isValidElement, useEffect, useState } from "react";
import { detectMediaLink } from "../api";
import { arrHas, isNotNull } from "../common/common";
import { Carousel } from "./Carousel";
import { Iframe, Image } from "./Components";
import { FlexVideo } from "./FlexVideo";

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
  if (!src) return null;
  if (type === "image") {
    return <Image key={key || src} src={src} options={options} />;
  } else if (type === "video") {
    return <FlexVideo key={key || src} src={src} {...options} />;
  } else if (type === "iframe") {
    return <Iframe key={key || src} src={src} options={options} />;
  } else if (type === "iframe-short") {
    return <Iframe key={key || src} src={src} options={{ ...options, isShort: true }} />;
  }

  return null;
};

const resolveComponent = async (opts: URLProps): Promise<JSX.Element> => {
  // takes a ParsedResponse (usually from Expando or resolveLink) and returns a media component
  const { response, options } = opts || {};
  const { href, src, component, args, cb } = (response as ParsedResponse) || {};
  // if a component exists in the response or the callback result then return it
  const resolved = args && cb && (await cb(...args));
  if (isValidElement(component) || isValidElement(resolved?.component)) return component || resolved?.component;
  // if we have a list of responses (Imgur) then load them into media components
  const aResolved =
    arrHas(resolved) && resolved[0].src
      ? (resolved as ParsedResponse[]).reduce((acc: JSX.Element[], r, i) => {
          const _component = r?.src && loadComponent({ response: r, options, key: i.toString() });
          if (isValidElement(_component)) acc.push(_component);
          return acc;
        }, [])
      : null;
  if (isNotNull(aResolved) && arrHas(aResolved) && aResolved.length > 1) return <Carousel slides={aResolved} />;
  // edge case: Imgur single-media album
  else if (isNotNull(aResolved) && arrHas(aResolved)) return aResolved[0];

  // otherwise we load a component from our resolver
  return loadComponent({
    response: resolved || response,
    options,
    key: src || href,
  }) as JSX.Element;
};
const resolveLink = async (opts: URLProps) => {
  const { link, options } = opts || {};
  const detected = typeof link === "string" ? await detectMediaLink(link) : null;
  const resolved = detected && (await resolveComponent({ response: detected, options }));
  // if we're provided a component return it
  if (isValidElement(resolved) || isValidElement(detected?.component))
    return (detected?.component as JSX.Element) || (resolved as ParsedResponse);
  // otherwise load a media component from our response
  const pResolved = resolved as ParsedResponse;
  const rComponent = pResolved?.component && isValidElement(pResolved.component) ? pResolved.component : null;
  const lComponent = pResolved?.src ? loadComponent({ response: pResolved, options }) : null;
  return rComponent || lComponent;
};
const resolveAlbum = async (opts: URLProps) => {
  const { links, options } = opts || {};
  try {
    if (arrHas(links as string[]) && typeof links?.[0] !== "string")
      throw Error("resolveAlbum only resolves a list of strings!");
    // resolve urls into a list of media components
    const resolved = [] as JSX.Element[];
    for (const link of links || []) {
      const _resolved = await resolveLink({ link, options });
      if (isValidElement(_resolved)) resolved.push(_resolved);
    }
    // wrap media in a Carousel if necessary
    if (arrHas(resolved) && resolved.length > 1) return <Carousel slides={resolved} />;
    else if (arrHas(resolved)) return resolved[0];
    return null;
  } catch (e) {
    console.error(e);
  }
};

const resolveChildren = async (opts: URLProps) => {
  const { links, response, options } = opts || {};
  const cResolved = response && (await resolveComponent({ links, response, options }));
  const lResolved = arrHas(links as string[]) && resolveAlbum({ links, options });
  if (!cResolved && !lResolved)
    throw Error(`resolveChildren unable to resolve to a JSX Element: ${response} ${links} ${options}`);
  return (cResolved || lResolved) as JSX.Element;
};
const ResolveMedia = (props: ResolvedMediaProps) => {
  // use useResolvedLinks to return media components from a list of urls
  const { id, className, links, options } = props || {};
  const [children, setChildren] = useState<JSX.Element | JSX.Element[]>();

  useEffect(() => {
    (async () => {
      const resolved = await resolveChildren({ links, options });
      if (isValidElement(resolved) && !children) setChildren(resolved);
    })();
  }, [links, options, children]);

  return children ? (
    <div id={id} className={className}>
      {children}
    </div>
  ) : null;
};

export { resolveChildren, ResolveMedia };
