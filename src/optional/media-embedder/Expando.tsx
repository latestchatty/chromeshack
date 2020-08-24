import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpandAlt, faCompressAlt } from "@fortawesome/free-solid-svg-icons";

import { getLinkType, classNames, arrHas, objHas } from "../../core/common";
import useResolvedLink from "../../core/useResolvedLink";

import type { MediaLinkOptions } from "./";

const commonIconStyle = {
    fill: "white",
    height: "12px",
    width: "auto",
};
const ExpandIcon = () => <FontAwesomeIcon icon={faExpandAlt} style={commonIconStyle} />;
const CompressIcon = () => <FontAwesomeIcon icon={faCompressAlt} style={commonIconStyle} />;

interface ExpandoProps {
    link: HTMLAnchorElement;
    idx: string;
    postid?: string;
    options?: MediaLinkOptions;
}

const RenderExpando = ({ link, idx, postid, options }: ExpandoProps) => {
    const [toggled, setToggled] = useState(false);
    const id = postid ? `expando_${postid}-${idx}` : `expando-${idx}`;
    const children = useResolvedLink({ link: link.href, postid, idx, options });
    const type =
        arrHas(children) && children[0]?.key
            ? getLinkType(children[0].key) || getLinkType(children.key)
            : getLinkType(link.href);
    const parentClasses = classNames("medialink", { toggled });
    // only allow toggle-by-click for explicit types
    const includedType = ["image", "video"].find((t) => type === t);
    const childClasses = classNames("media", { hidden: !toggled, canToggleClick: includedType });

    const toggleEmbed = () => {
        if (type === "instagram" || type === "twitter") {
            const mediaVideos = [...document.querySelectorAll(`a#${id} media video`)] as HTMLVideoElement[];
            for (const vid of mediaVideos) {
                // transitioning from visible -> invisible
                if (toggled) vid.pause();
                else vid.play();
            }
        }
    };
    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        setToggled(!toggled);
        toggleEmbed();
        return false;
    };
    return (
        <div id={id} className={parentClasses} data-postid={postid} data-idx={idx}>
            <a href={link.href} onClick={handleClick}>
                <span>{link.href}</span>
                <div className="expando">
                    {toggled ? (
                        <span role="img" aria-label="close">
                            <CompressIcon />
                        </span>
                    ) : (
                        <span role="img" aria-label="open">
                            <ExpandIcon />
                        </span>
                    )}
                </div>
            </a>
            <div className={childClasses} onClick={includedType ? handleClick : undefined}>
                {toggled ? children : <div />}
            </div>
        </div>
    );
};

const Expando = ({ link, idx, postid, options }: ExpandoProps) =>
    React.useMemo(() => <RenderExpando link={link} postid={postid} idx={idx} options={options} />, []);
export default Expando;
