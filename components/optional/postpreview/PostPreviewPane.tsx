import parse, { domToReact, type DOMNode, type Element } from "html-react-parser";
import { memo } from "react";
import { createPortal } from "react-dom";
import { classNames } from "../../core/common/common";

const PostPreviewPane = memo((props: { target: HTMLElement; toggled: boolean; input: string }) => {
  const { target, toggled, input } = props || {};
  const onSpoilerClick = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    const _this = e.target as HTMLElement;
    if (!_this?.classList?.contains("jt_spoiler_clicked")) {
      _this.classList.remove("jt_spoiler");
      _this.classList.add("jt_spoiler_clicked");
    }
  };
  const modifySpoiler = (node: Element) => {
    if (node.name === "span" && node.attribs["class"].includes("jt_spoiler"))
      return (
        <span className={node.attribs["class"]} onClick={onSpoilerClick}>
          {domToReact(node.children)}
        </span>
      );
  };
  return createPortal(
    <div id="previewArea" className={classNames({ hidden: !toggled })}>
      {parse(input, {
        replace: (node: Element | DOMNode): void => {
          if (!node) return;
          modifySpoiler(node as Element);
        },
      })}
    </div>,
    target,
  );
});

export { PostPreviewPane };
