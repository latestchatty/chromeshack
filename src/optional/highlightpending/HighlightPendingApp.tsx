import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { arrHas, classNames } from "../../core/common";
import { usePendingPosts } from "./usePendingPosts";

const ChevronLeft = () => <FontAwesomeIcon className="hpnp__prev__icon" icon={faChevronLeft} />;
const ChevronRight = () => <FontAwesomeIcon className="hpnp__next__icon" icon={faChevronRight} />;

const HighlightPendingApp = (props: { threaded: boolean }) => {
    const { threaded } = props || {};
    const { pendings, pendingText, handlePrevClick, handleNextClick } = usePendingPosts(threaded);

    return arrHas(pendings) ? (
        <div id="hpnp__container" onClick={(e) => e.preventDefault()}>
            {threaded && (
                <button id="prev__btn" title="Jump to previous post" onClick={handlePrevClick}>
                    <ChevronLeft />
                </button>
            )}
            <span id="statustext" className={classNames({ threaded })} onClick={handleNextClick}>
                {pendingText}
            </span>
            {threaded && (
                <button id="next__btn" title="Jump to next post" onClick={handleNextClick}>
                    <ChevronRight />
                </button>
            )}
        </div>
    ) : null;
};

export { HighlightPendingApp };
