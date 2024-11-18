import { memo } from "react";
import { classNames } from "../../core/common/common";
import { PostPreviewPane } from "./PostPreviewPane";
import usePostPreviewApp from "./usePostPreviewApp";

const PostPreviewApp = memo((props: { postboxElem: HTMLElement; paneMountElem: HTMLElement }) => {
  const { paneMountRef, toggled, input, handleToggleClick } = usePostPreviewApp(props);

  return (
    <>
      <PostPreviewPane target={paneMountRef} toggled={toggled} input={input} />
      <button id="previewButton" className={classNames({ toggled })} onClick={handleToggleClick}>
        Preview
      </button>
    </>
  );
});
export { PostPreviewApp };
