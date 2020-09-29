import React, { useEffect, useRef } from "react";
import { unmountComponentAtNode } from "react-dom";
import { elemMatches } from "../../core/common";
import { HighlightFilters } from "./HighlightFilters";
import { LOLList } from "./LOLList";
import { UserFilter } from "./UserFilter";

const UserPopupApp = (props: { username: string; isLoggedInUser: boolean; isUserBadge: boolean }) => {
    const { username, isLoggedInUser, isUserBadge } = props || {};
    const rootRef = useRef(null);

    useEffect(() => {
        const popupClickHandler = (e: MouseEvent) => {
            const _this = e.target as HTMLElement;
            const root = rootRef?.current?.parentNode as HTMLElement;
            const is_lol_elem = elemMatches(_this, ".userDropdown span");
            // the below is a preemptive compatibility solution for React 17.x+
            if (!is_lol_elem && root) {
                // forcefully unmount our popup when clicking outside
                unmountComponentAtNode(root);
                root.parentNode.removeChild(root);
            }
        };
        document.removeEventListener("click", popupClickHandler);
        document.addEventListener("click", popupClickHandler);
    }, []);

    return (
        <div className="dropdown__container" ref={rootRef}>
            <LOLList username={username} isLoggedInUser={isLoggedInUser} />
            {isUserBadge && (
                <>
                    <UserFilter username={username} isLoggedInUser={isLoggedInUser} />
                    <HighlightFilters username={username} />
                </>
            )}
        </div>
    );
};

export { UserPopupApp };
