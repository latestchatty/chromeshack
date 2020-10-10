import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { arrHas } from "../../core/common";
import { usePendingPosts } from "./usePendingPosts";

const ChevronLeft = () => <FontAwesomeIcon className="hpnp__prev__icon" icon={faChevronLeft} />;
const ChevronRight = () => <FontAwesomeIcon className="hpnp__next__icon" icon={faChevronRight} />;

const HighlightPendingApp = () => {
    const { pendings, pendingText, handlePrevClick, handleNextClick } = usePendingPosts();

    return arrHas(pendings) ? (
        <div id="hpnp__container" onClick={(e) => e.preventDefault()}>
            <button id="prev__btn" title="Jump to previous post" onClick={handlePrevClick}>
                <ChevronLeft />
            </button>
            <span id="statustext" onClick={handleNextClick}>
                {pendingText}
            </span>
            <button id="next__btn" title="Jump to next post" onClick={handleNextClick}>
                <ChevronRight />
            </button>
        </div>
    ) : null;
};

export { HighlightPendingApp };
