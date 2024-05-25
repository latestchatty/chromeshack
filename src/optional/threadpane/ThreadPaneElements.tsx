import { faAngleDoubleRight, faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
import { memo } from "react";
import { classNames } from "../../core/common/common";
import { scrollParentToChild } from "../../core/common/dom";
import { RefreshIcon } from "../media-embedder/Expando";
import { useThreadPaneCard } from "./useThreadPaneCard";

const StepForwardIcon = memo(() => <FontAwesomeIcon icon={faAngleDoubleRight} />);
const CommentDotsIcon = memo(() => <FontAwesomeIcon icon={faCommentDots} />);

export const ThreadPaneReply = memo((props: { recent: ParsedReply; mostRecent?: boolean }) => {
  const { recent, mostRecent } = props || {};
  const { authorid, author, body, mod, op } = recent || {};

  return (
    <div
      className={classNames("cs_thread_pane_reply", {
        reply_most_recent: mostRecent,
      })}>
      <div className={classNames("cs_thread_pane_reply_arrow", `${mod}`)}>↪</div>
      <div className="cs_thread_pane_reply_preview">{body}</div>
      <div className="cs_thread_pane_reply_divider">:</div>
      <div className={classNames(`cs_thread_pane_reply_author replyid_${authorid}`, { op })}>{author}</div>
    </div>
  );
});

export const ThreadPaneReplies = memo((props: { recents: Recents }) => {
  const { recents: parents } = props || {};
  const { recentTree: recents } = parents || {};

  return recents ? (
    <div className="cs_thread_pane_replies">
      {recents?.map((r, i) => {
        return <ThreadPaneReply key={i} recent={r} mostRecent={i === recents.length - 1} />;
      })}
    </div>
  ) : null;
});

export const ThreadPaneCard = memo((props: { post: ParsedPost }) => {
  const { post } = props || {};
  const {
    collapsed,
    handleClickReload,
    handleClickThreadShortcut,
    handleCardClick,
    localPost,
    localRecents,
    pending,
    refreshed,
  } = useThreadPaneCard(post);
  const { author, authorid, body, contained, count, mod, rootid } = localPost || {};

  return localPost?.rootid ? (
    <div
      className={classNames("cs_thread_pane_card", `cs_thread_pane_card_${mod}`, {
        cs_thread_pane_card_refresh_pending: pending,
        collapsed,
      })}
      id={rootid ? `item_${rootid.toString()}` : ""}
      onClick={handleCardClick}>
      <div className="cs_thread_pane_card_header">
        <div className={`cs_thread_pane_root_author authorid_${authorid}`}>{author}</div>
        {contained && (
          <div className="cs_thread_contains_user" title="You replied to this thread">
            <CommentDotsIcon />
          </div>
        )}
        <div className="cs_thread_pane_post_count">{count && count > 0 ? `${count} posts` : ""}</div>
        <div className="cs_thread_pane_reload" title="Refresh this thread" onClick={handleClickReload}>
          <RefreshIcon classes={classNames("refresh__icon", { loading: refreshed })} />
        </div>
        <div className="cs_thread_pane_shortcut" title="Jump to thread" onClick={handleClickThreadShortcut}>
          <StepForwardIcon />
        </div>
      </div>
      <div className="cs_thread_pane_root_body">{body ? parse(body) : ""}</div>
      {!collapsed && <ThreadPaneReplies recents={localRecents as Recents} />}
    </div>
  ) : null;
});

export const ThreadPaneJumpToTop = () => {
  const handleJumpToTop = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    const _this = e.target as HTMLElement;
    const csPane = _this?.closest && (_this?.closest("div#cs_thread_pane") as HTMLElement);
    const firstCard = _this?.parentNode?.firstElementChild as HTMLElement;
    if (csPane && firstCard) scrollParentToChild(csPane, firstCard);
  };
  return (
    <div className="cs_thread_pane_jump_to_top" onClick={handleJumpToTop}>
      Jump to top
    </div>
  );
};
