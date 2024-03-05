import { useCallback, useEffect, useRef, useState } from "react";
import { getLinkType } from "../../core/common/common";
import { elemMatches } from "../../core/common/dom";
import { resolveChildren } from "../../core/useResolvedLinks";

interface ExpandoExports {
  handleToggleClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  handleNewClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  handleRefreshClick: () => void;
  newTabHref: string;
  src: string;
  href: string;
  toggled: boolean;
  hasLoaded: boolean;
  children: JSX.Element | null;
}

const useExpando = (props: ExpandoProps) => {
  const { response, options } = props || {};
  const { href, src, type: _type } = response || {};
  const { openByDefault } = options || {};

  const [toggled, setToggled] = useState(openByDefault || false);
  const [children, setChildren] = useState<JSX.Element | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [type, setType] = useState(_type as string);
  const newTabHref = useRef<string>((href || src) as string).current;

  const loadChildren = useCallback(() => {
    (async () => {
      const _children = await resolveChildren({ response, options });
      const __type = _children?.props?.src && getLinkType(_children.props.src);
      if (_children) {
        setChildren(_children);
        setHasLoaded(true);
      }
      if (__type) setType(__type);
    })();
  }, [response, options]);
  const handleToggleClick = useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e.preventDefault();
      const _this = e?.target as HTMLElement;
      const _mediaParent = type === "image" && elemMatches(_this, "img");
      const _expando = !_this?.closest("div.media") && _this?.closest("div.medialink");
      // only clickTogglesVisible on media when an image or expando link
      if ((_mediaParent && type === "image" && toggled) || _expando) setToggled(!toggled);
    },
    [type, toggled]
  );
  const handleNewClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e.preventDefault();
      const newWindow = window.open(newTabHref, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    },
    [newTabHref]
  );
  const handleRefreshClick = useCallback(() => {
    // less graceful reload method
    setHasLoaded(false);
    setChildren(null);
    // use a delay so we see the animation each time
    setTimeout(() => {
      loadChildren();
      // should be visible?
      if (children) setToggled(true);
    }, 100);
  }, [children, loadChildren]);

  useEffect(() => {
    if (toggled) loadChildren();
  }, [toggled, loadChildren]);
  return {
    handleToggleClick,
    handleNewClick,
    handleRefreshClick,
    newTabHref,
    children,
    hasLoaded,
    toggled,
    src,
    href,
  } as ExpandoExports;
};
export default useExpando;
