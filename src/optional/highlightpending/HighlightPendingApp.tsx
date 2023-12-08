import {
	faChevronLeft,
	faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useEffect, useRef } from "react";
import { arrHas, classNames } from "../../core/common/common";
import { useHeaderObserver } from "./useHeaderObserver";
import { usePendingPosts } from "./usePendingPosts";

const ChevronLeft = () => (
	<FontAwesomeIcon className="hpnp__prev__icon" icon={faChevronLeft} />
);
const ChevronRight = () => (
	<FontAwesomeIcon className="hpnp__next__icon" icon={faChevronRight} />
);

const HighlightPendingApp = memo(
	(props: { threaded: boolean; elRef: HTMLElement }) => {
		const { threaded, elRef } = props || {};
		const headerRef = useRef(document.querySelector("header")).current;

		const { pendings, pendingText, handlePrevClick, handleNextClick } =
			usePendingPosts(threaded);
		const { isNarrow, isVisible, hasScrolled } = useHeaderObserver(
			headerRef,
			elRef,
		);

		useEffect(() => {
			if (!elRef) return;
			// media-query triggered narrow mode
			if (isNarrow) elRef.classList.add("narrow");
			else elRef.classList.remove("narrow");
			// header hidden by scrolling in narrow-mode
			if (isVisible) elRef.classList.add("header-shown");
			else elRef.classList.remove("header-shown");
			// header minimized by scrolling in wide-mode
			if (hasScrolled) elRef.classList.add("scrolled");
			else elRef.classList.remove("scrolled");
		}, [elRef, isNarrow, isVisible, hasScrolled]);

		return arrHas(pendings) ? (
			<div id="hpnp__container" onClick={(e) => e.preventDefault()}>
				{threaded && (
					<button
						id="prev__btn"
						title="Jump to previous post"
						onClick={handlePrevClick}
					>
						<ChevronLeft />
					</button>
				)}
				<span
					id="statustext"
					className={classNames({ threaded })}
					title="Jump to next post"
					onClick={handleNextClick}
				>
					{pendingText}
				</span>
				{threaded && (
					<button
						id="next__btn"
						title="Jump to next post"
						onClick={handleNextClick}
					>
						<ChevronRight />
					</button>
				)}
			</div>
		) : null;
	},
);

export { HighlightPendingApp };
