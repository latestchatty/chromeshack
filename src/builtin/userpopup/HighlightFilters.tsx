import React, { memo, useEffect, useState } from "react";
import { arrHas } from "../../core/common/common";
import {
  addHighlightUser,
  enabledContains,
  getMutableHighlights,
  highlightGroupContains,
  removeHighlightUser,
} from "../../core/settings";

const HighlightFilter = memo(
  (props: { username: string; groupName: string; isContained: boolean }) => {
    const { username, groupName, isContained: _isContained } = props || {};
    const [isHighlight, setIsHighlight] = useState(_isContained);
    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e.preventDefault();
      (async () => {
        const highlightsHas = await highlightGroupContains(groupName, username);
        if (highlightsHas) await removeHighlightUser(groupName, username);
        else await addHighlightUser(groupName, username);
        setIsHighlight(!isHighlight);
      })();
    };
    return (
      <div className="dropdown__item">
        <span onClick={handleClick}>{`${
          isHighlight ? "Remove from" : "Add to"
        } Highlights Group: ${groupName}`}</span>
      </div>
    );
  }
);

const HighlightFilters = memo((props: { username: string }) => {
  const { username } = props || {};
  const [isEnabled, setIsEnabled] = useState(false);
  const [children, setChildren] = useState(null as JSX.Element[]);
  useEffect(() => {
    (async () => {
      const highlightsEnabled = await enabledContains(["highlight_users"]);
      if (highlightsEnabled) setIsEnabled(true);

      const highlightGroups = await getMutableHighlights();
      const _children = [] as JSX.Element[];
      for (const [i, group] of highlightGroups.entries() || []) {
        const groupContainsUser = await highlightGroupContains(
          group.name,
          username
        );
        _children.push(
          <HighlightFilter
            key={i}
            username={username}
            groupName={group.name}
            isContained={!!groupContainsUser}
          />
        );
      }
      if (arrHas(_children)) setChildren(_children);
    })();
  }, [username]);

  return isEnabled ? (
    <>
      <div className="dropdown__separator" />
      {children}
    </>
  ) : null;
});

export { HighlightFilters };
