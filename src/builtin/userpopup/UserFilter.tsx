import { memo, useCallback, useEffect, useState } from "react";
import { addFilter, enabledContains, filtersContains, removeFilter } from "../../core/settings";

const UserFilter = memo((props: { username: string; isLoggedInUser: boolean }) => {
  const { username } = props || {};

  const [isEnabled, setIsEnabled] = useState(false);
  const [isFilter, setIsFilter] = useState(false);

  const handleFilterClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      e.preventDefault();
      (async () => {
        if (isFilter) await removeFilter(username);
        else await addFilter(username);
        setIsFilter(!isFilter);
      })();
    },
    [username, isFilter],
  );

  useEffect(() => {
    (async () => {
      setIsEnabled(await enabledContains(["custom_user_filters"]));
      const _isfilter = await filtersContains(username);
      setIsFilter(!!_isfilter);
    })();
  }, [username]);

  return isEnabled ? (
    <>
      <div className="dropdown__separator" />
      <div className="dropdown__item">
        <span onClick={handleFilterClick}>{`${isFilter ? "Remove from" : "Add to"} Custom Filters`}</span>
      </div>
    </>
  ) : null;
});

export { UserFilter };
