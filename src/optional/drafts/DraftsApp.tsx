import { memo } from "react";
import { classNames } from "../../core/common/common";
import useDraftsApp from "./useDraftsApp";

export interface DraftsAppProps {
  postid: number;
  inputBox: HTMLInputElement;
}

const DraftsApp = memo((props: DraftsAppProps) => {
  const { valid } = useDraftsApp(props);

  return (
    <div
      className={classNames("drafts__dot", { valid, invalid: !valid })}
      title={valid ? "This post has been saved to drafts" : "This post is not saved to drafts"}
    />
  );
});

export { DraftsApp };
