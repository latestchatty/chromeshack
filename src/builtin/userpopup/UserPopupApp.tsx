import { memo, useCallback, useEffect, useRef } from "react";
import { type Root } from "react-dom/client";
import { elemMatches } from "../../core/common/dom";
import { userPopupEvent } from "../../core/events";
import { HighlightFilters } from "./HighlightFilters";
import { LOLList } from "./LOLList";
import { UserFilter } from "./UserFilter";

const UserPopupApp = memo(
  (props: { username: string; isLoggedInUser: boolean; isUserBadge: boolean; parentRoot: Root }) => {
    const { username, isLoggedInUser, isUserBadge, parentRoot } = props || {};
    const rootRef = useRef<HTMLDivElement>(null);

    const popupClickHandler = useCallback(
      (e: MouseEvent) => {
        const _this = e.target as HTMLElement;
        const root = rootRef?.current?.parentNode as HTMLElement;
        const is_lol_elem = elemMatches(_this, ".userDropdown span");
        if (!is_lol_elem && root) {
          // forcefully unmount our popup when clicking outside
          userPopupEvent.raise({ root: parentRoot });
          root.parentNode?.removeChild(root);
        }
      },
      [parentRoot]
    );

    useEffect(() => {
      document.addEventListener("click", popupClickHandler);
      return () => document.removeEventListener("click", popupClickHandler);
    }, [popupClickHandler]);

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
  }
);

export { UserPopupApp };
