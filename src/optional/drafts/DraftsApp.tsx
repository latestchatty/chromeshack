import React from "react";
import { classNames } from "../../core/common";
import { useDrafts } from "./useDrafts";

const DraftsApp = (props: { postid: number; inputBox: HTMLInputElement }) => {
    const { postid, inputBox } = props || {};
    const valid = useDrafts(postid, inputBox);

    return (
        <div
            className={classNames("drafts__dot", { valid, invalid: !valid })}
            title={valid ? "This post has been saved to drafts" : "This post is not saved to drafts"}
        />
    );
};

export { DraftsApp };
