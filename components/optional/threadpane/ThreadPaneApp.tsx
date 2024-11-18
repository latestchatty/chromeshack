import { memo, useEffect, useState } from "react";
import { arrHas } from "../../core/common/common";
import { getUsername } from "../../core/notifications";
import { ThreadPaneCard, ThreadPaneJumpToTop } from "./ThreadPaneElements";
import { parseRoot } from "./helpers";

const ThreadPaneApp = memo(() => {
  const [parsed, setParsed] = useState([] as ParsedPost[]);

  useEffect(() => {
    const initPane = async () => {
      const loggedUser = await getUsername();
      const roots = [...document.querySelectorAll("div.root")] as HTMLElement[];
      const parsedRoots = roots.reduce((acc, r) => {
        const _parsed = parseRoot(r, loggedUser);
        if (_parsed != null) acc.push(_parsed);
        return acc;
      }, [] as ParsedPost[]);
      if (parsedRoots.length > 0) setParsed(parsedRoots);
    };

    initPane();
  }, []);

  return arrHas(parsed) ? (
    <div id="cs_thread_pane_list">
      {parsed.map((p, i) => (
        <ThreadPaneCard key={i} post={p} />
      ))}
      {parsed?.length > 0 && <ThreadPaneJumpToTop />}
    </div>
  ) : null;
});

export { ThreadPaneApp };
