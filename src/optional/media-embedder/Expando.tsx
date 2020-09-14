import React, { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpandAlt, faCompressAlt, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

import { classNames, getLinkType } from "../../core/common";
import { useResolvedLinks } from "../../core/useResolvedLinks";

import type { FCWithMediaProps, ExpandoProps } from "./index.d";

const ExpandIcon = () => <FontAwesomeIcon className="expand__icon" icon={faExpandAlt} />;
const CompressIcon = () => <FontAwesomeIcon className="compress__icon" icon={faCompressAlt} />;
const ExternalLink = () => <FontAwesomeIcon className="external__icon" icon={faExternalLinkAlt} />;

const RenderExpando = (props: ExpandoProps) => {
    const [toggled, setToggled] = useState(false);

    const { link, idx, postid, options } = props || {};
    const id = postid ? `expando_${postid}-${idx}` : `expando-${idx}`;

    const expandoClasses = classNames("medialink", { toggled });
    const mediaClasses = classNames("media", { hidden: !toggled });
    const children = useResolvedLinks({ link: link.href, options });
    // pull the 'src' from props if we have a rendered component
    const type = (children as FCWithMediaProps)?.props?.src
        ? getLinkType((children as FCWithMediaProps).props.src)
        : getLinkType(link.href);

    const handleToggleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement, MouseEvent>) => {
            e.preventDefault();
            setToggled(!toggled);
        },
        [toggled, setToggled],
    );
    const handleNewClick = useCallback(() => {
        const _href = (children as FCWithMediaProps)?.props?.src || link?.href;
        const newWindow = window.open(_href, "_blank", "noopener,noreferrer");
        if (newWindow) newWindow.opener = null;
    }, [link, children]);

    return (
        <div id={id} className={expandoClasses} data-postid={postid} data-idx={idx}>
            <a
                href={link.href}
                title={toggled ? "Hide embedded media" : "Show embedded media"}
                onClick={handleToggleClick}
            >
                <span>{link.href}</span>
                <div className="expando">{toggled ? <CompressIcon /> : <ExpandIcon />}</div>
            </a>
            <a className="expandalt" title="Open in new tab" onClick={handleNewClick}>
                <ExternalLink />
            </a>
            {/* click-to-toggle visibility only for 'image' type embeds */}
            <div className={mediaClasses} onClick={type === "image" ? handleToggleClick : undefined}>
                {toggled ? children : null}
            </div>
        </div>
    );
};

export const Expando = (props: ExpandoProps) => React.useMemo(() => <RenderExpando {...props} />, [props]);
