import { memo } from "react";
import { classNames } from "../../core/common/common";
import useTemplatesApp from "./useTemplatesApp";
import TemplateItem from "./TemplateItem";

const TemplatesApp = memo((props: { inputBox: HTMLInputElement }) => {
  const { popupRef, popupVisible, templates, handleBtnClick, handlePopupClick } = useTemplatesApp(props);

  return (
    <>
      <button id="templates__btn" className={classNames({ toggled: popupVisible })} onClick={handleBtnClick}>
        Templates
      </button>
      <div className={classNames("templates__popup", { visible: popupVisible })} ref={popupRef}>
        {templates.map((t, i) => {
          return <TemplateItem key={i} idx={i} body={t} onClick={handlePopupClick} />;
        })}
      </div>
    </>
  );
});

export { TemplatesApp };
