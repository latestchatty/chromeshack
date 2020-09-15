import { faCompressAlt, faExpandAlt, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useEffect, useState } from "react";
import { classNames, getLinkType } from "../../core/common";
import { resolveLink } from "../../core/useResolvedLinks";
import type { ExpandoProps, FCWithMediaProps } from "./index.d";

const ExpandIcon = () => <FontAwesomeIcon className="expand__icon" icon={faExpandAlt} />;
const CompressIcon = () => <FontAwesomeIcon className="compress__icon" icon={faCompressAlt} />;
const ExternalLink = () => <FontAwesomeIcon className="external__icon" icon={faExternalLinkAlt} />;

const RenderExpando = (props: ExpandoProps) => {
    const { response, idx, postid, options } = props || {};
    const { href, src, type } = response || {};

    const [toggled, setToggled] = useState(false);
    const [children, setChildren] = useState(null as JSX.Element);

    const id = postid ? `expando_${postid}-${idx}` : `expando-${idx}`;
    const expandoClasses = classNames("medialink", { toggled });
    const mediaClasses = classNames("media", { hidden: !toggled });

    const handleToggleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement, MouseEvent>) => {
            e.preventDefault();
            setToggled(!toggled);
        },
        [toggled, setToggled],
    );
    const handleNewClick = useCallback(() => {
        const _href = (children as FCWithMediaProps)?.props?.src || src;
        const newWindow = window.open(_href, "_blank", "noopener,noreferrer");
        if (newWindow) newWindow.opener = null;
    }, [src, children]);

    useEffect(() => {
        (async () => {
            const _type = type ? type : getLinkType(src || href);
            const resolved = (await resolveLink({
                link: src || href,
                options: { ...options, clickTogglesVisible: _type === "image" },
            })) as FCWithMediaProps;
            if (resolved) setChildren(resolved);
        })();
    }, [href, src, props, response, options, type]);

    return (
        <div id={id} className={expandoClasses} data-postid={postid} data-idx={idx}>
            <a
                href={href || src}
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
            <div className={mediaClasses} onClick={type === "image" ? handleToggleClick : undefined}>
                {toggled ? children : null}
            </div>
        </div>
    );
};

export const Expando = (props: ExpandoProps) => React.useMemo(() => <RenderExpando {...props} />, [props]);
