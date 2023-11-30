import React, { memo } from "react";
import { classNames } from "../../core/common/common";
import { useDrafts } from "./useDrafts";

const DraftsApp = memo(
  (props: { postid: number; inputBox: HTMLInputElement }) => {
    const { postid, inputBox } = props || {};
    const valid = useDrafts(postid, inputBox);

    return (
      <div
        className={classNames("drafts__dot", { valid, invalid: !valid })}
        title={
          valid
            ? "This post has been saved to drafts"
            : "This post is not saved to drafts"
        }
      />
    );
  }
);

export { DraftsApp };
