import { faCompressAlt, faExpandAlt, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useEffect, useState } from "react";
import { classNames, elemMatches, getLinkType } from "../../core/common";
import { useResolvedLinks } from "../../core/useResolvedLinks";
import type { ExpandoProps, FCWithMediaProps } from "./index.d";

const ExpandIcon = () => <FontAwesomeIcon className="expand__icon" icon={faExpandAlt} />;
const CompressIcon = () => <FontAwesomeIcon className="compress__icon" icon={faCompressAlt} />;
const ExternalLink = () => <FontAwesomeIcon className="external__icon" icon={faExternalLinkAlt} />;

const RenderExpando = (props: ExpandoProps) => {
    const { response, idx, postid, options } = props || {};
    const { href, src, type: _type } = response || {};

    const [toggled, setToggled] = useState(false);
    const [children, setChildren] = useState(null as JSX.Element);
    const [type, setType] = useState(_type as string);
    const { resolved, hasLoaded } = useResolvedLinks({ response, options, toggled });

    const id = postid ? `expando_${postid}-${idx}` : `expando-${idx}`;
    const expandoClasses = classNames("medialink", { toggled });
    const mediaClasses = classNames("media", { hidden: !toggled });

    const handleToggleClick = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e.preventDefault();
            const _this = e?.target as HTMLElement;
            const _parent = _this.offsetParent as HTMLElement;
            const _mediaParent = elemMatches(_parent, "div.media");
            const _fullpostParent = elemMatches(_parent, "div.fullpost");
            // only clickTogglesVisible on media when an image or link
            if ((_mediaParent && type === "image") || _fullpostParent) setToggled(!toggled);
        },
        [toggled, type],
    );
    const handleNewClick = useCallback(() => {
        const _href = (children as FCWithMediaProps)?.props?.src || src;
        const newWindow = window.open(_href, "_blank", "noopener,noreferrer");
        if (newWindow) newWindow.opener = null;
    }, [src, children]);

    useEffect(() => {
        (async () => {
            const __type = resolved?.props?.src && getLinkType(resolved.props.src);
            if (toggled && hasLoaded) {
                setChildren(resolved);
                setType(__type);
            }
        })();
    }, [toggled, hasLoaded, resolved]);

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
            <a className="expandalt" title="Open in new tab" onClick={handleNewClick}>
                <ExternalLink />
            </a>
            {/* click-to-toggle visibility only for 'image' type embeds */}
            <div className={mediaClasses} onClick={handleToggleClick}>
                {toggled ? children : null}
            </div>
        </div>
    );
};

export const Expando = (props: ExpandoProps) => React.useMemo(() => <RenderExpando {...props} />, [props]);
