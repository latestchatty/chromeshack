import { faCompressAlt, faExpandAlt, faExternalLinkAlt, faRedoAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { classNames, elemMatches, getLinkType } from "../../core/common";
import { resolveChildren, useResolvedLinks } from "../../core/useResolvedLinks";
import type { ExpandoProps } from "./index.d";

const ExpandIcon = () => <FontAwesomeIcon className="expand__icon" icon={faExpandAlt} />;
const CompressIcon = () => <FontAwesomeIcon className="compress__icon" icon={faCompressAlt} />;
const ExternalLink = () => <FontAwesomeIcon className="external__icon" icon={faExternalLinkAlt} />;
const RefreshIcon = () => <FontAwesomeIcon className="refresh__icon" icon={faRedoAlt} />;

const RenderExpando = (props: ExpandoProps) => {
    const { response, idx, postid, options } = props || {};
    const { href, src, type: _type } = response || {};
    const { openByDefault } = options || {};

    const [toggled, setToggled] = useState(false);
    const [children, setChildren] = useState(null as JSX.Element);
    const [type, setType] = useState(_type as string);
    const { resolved, hasLoaded } = useResolvedLinks({ response, options, toggled });
    const newTabHref = useRef(href || src);

    const id = postid ? `expando_${postid}-${idx}` : `expando-${idx}`;
    const expandoClasses = classNames("medialink", { toggled });
    const mediaClasses = classNames("media", { hidden: !toggled });

    const handleToggleClick = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e.preventDefault();
            const _this = e?.target as HTMLElement;
            const _mediaParent = elemMatches(_this.offsetParent as HTMLElement, "div.media");
            const _expando = elemMatches(_this.nextElementSibling as HTMLElement, "div.expando");
            // only clickTogglesVisible on media when an image or expando link
            if ((_mediaParent && type === "image") || _expando) setToggled(!toggled);
        },
        [toggled, type],
    );
    const handleNewClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            e.preventDefault();
            // use the href before the resolved src link
            const newWindow = window.open(newTabHref?.current, "_blank", "noopener,noreferrer");
            if (newWindow) newWindow.opener = null;
        },
        [newTabHref],
    );
    const handleRefreshClick = useCallback(() => {
        (async () => {
            setToggled(false);
            const freshChildren = await resolveChildren({ response, options });
            if (isValidElement(freshChildren)) {
                setChildren(freshChildren); // less graceful approach than URL hook
                setToggled(true);
            }
        })();
    }, [response, options]);

    useEffect(() => {
        (async () => {
            // URL hook or resolveChildren() rendered so update type
            const __type = resolved?.props?.src && getLinkType(resolved.props.src);
            if (toggled && hasLoaded) {
                setChildren(resolved);
                setType(__type);
            }
        })();
    }, [toggled, hasLoaded, resolved]);
    useEffect(() => {
        // auto-toggle all detected embeds if the user has it enabled
        if (openByDefault !== undefined) setToggled(openByDefault);
    }, [openByDefault]);

    return (
        <div id={id} className={expandoClasses} data-postid={postid} data-idx={idx}>
            <a
                href={src || href}
                title={toggled ? "Hide embedded media" : "Show embedded media"}
                onClick={handleToggleClick}
            >
                <span>{href || src}</span>
                <div className="expando">{toggled ? <CompressIcon /> : <ExpandIcon />}</div>
            </a>
            <a className="reloadbtn" title="Reload embed" onClick={handleRefreshClick}>
                <RefreshIcon />
            </a>
            <a className="expandbtn" title="Open in new tab" href={newTabHref?.current || ""} onClick={handleNewClick}>
                <ExternalLink />
            </a>
            <div className={mediaClasses} onClick={handleToggleClick}>
                {toggled ? children : null}
            </div>
        </div>
    );
};

export const Expando = (props: ExpandoProps) => useMemo(() => <RenderExpando {...props} />, [props]);
