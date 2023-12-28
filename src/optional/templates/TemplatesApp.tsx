import { faCheck, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { arrHas, classNames, compressString, decompressString } from "../../core/common/common";
import { elemMatches } from "../../core/common/dom";
import { replyFieldEvent } from "../../core/events";
import { getSetting, setSetting } from "../../core/settings";

const SaveIcon = () => <FontAwesomeIcon className="templates__icon save--icon" icon={faCheck} />;
const DelIcon = () => <FontAwesomeIcon className="templates__icon del--icon" icon={faTimes} />;
const AddIcon = () => <FontAwesomeIcon className="templates__icon add--icon" icon={faPlus} />;

const TemplateItem = memo((props: { idx: number; body: string; onClick: any }) => {
  const { idx, body, onClick } = props || {};
  const hasBody = body?.length > 0;
  const isDefaultArr = !hasBody && idx === 0;

  return (
    <div className="template__item" data-idx={idx}>
      <span
        className={classNames({ disabled: isDefaultArr || !hasBody })}
        title={hasBody ? `${body}` : ""}
        onClick={onClick}
      >
        {hasBody && idx > -1 ? `${body}` : `Template #${idx + 1}`}
      </span>
      <button id="save__btn" className="template__btn" title="Save to this template slot" onClick={onClick}>
        <SaveIcon />
      </button>
      <button
        id="del__btn"
        className="template__btn"
        title={hasBody ? "Remove from this template slot" : ""}
        onClick={onClick}
        disabled={isDefaultArr}
      >
        <DelIcon />
      </button>
      <button
        id="add__btn"
        className="template__btn"
        title={hasBody ? "Add as a new template slot" : ""}
        onClick={onClick}
        disabled={isDefaultArr || !hasBody}
      >
        <AddIcon />
      </button>
    </div>
  );
});

const TemplatesApp = memo((props: { inputBox: HTMLInputElement }) => {
  const { inputBox } = props || {};

  const [templates, setTemplates] = useState([] as string[]);
  const [popupVisible, setPopupVisible] = useState(false);
  const popupRef = useRef(null);

  const loadTemplatesFromStore = useCallback(() => {
    (async () => {
      // decompress once when loading
      const _templates = (await getSetting("saved_templates", [])) as string[];
      const decompressed = arrHas(_templates)
        ? _templates.map((t) => {
            const _decomp = t.length > 0 && decompressString(t);
            return _decomp ? _decomp : t.length > 0 ? t : "";
          })
        : [""];
      setTemplates(decompressed);
    })();
  }, []);
  const saveTemplatesToStore = useCallback(() => {
    (async () => {
      const _templates = await getSetting("saved_templates");
      const _compressed = templates.map((t) => (t.length > 0 ? compressString(t) : ""));
      const areEqual = JSON.stringify(_templates) === JSON.stringify(_compressed);
      if (areEqual) return;
      if (arrHas(_compressed)) await setSetting("saved_templates", _compressed);
    })();
  }, [templates]);

  const handleBtnClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      setPopupVisible(!popupVisible);
    },
    [popupVisible],
  );
  const handlePopupClick = useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e.preventDefault();
      const _this = e.target as HTMLElement;
      const _itemNode = _this?.closest(".template__item");
      const _idx = parseInt(_itemNode?.getAttribute("data-idx"), 10) ?? -1;
      const _text = elemMatches(_this, ".template__item>span");
      const _btn = _this?.closest(".template__btn");
      if (_idx < 0 || !_itemNode) return;

      const _hasBody = templates[_idx]?.length > 0;
      const _val = inputBox.value;
      if (_text) {
        const template = _idx > -1 ? templates[_idx] : "";
        if (template) {
          inputBox.value = template;
          // notify subscribers that the replybox has changed
          replyFieldEvent.raise(inputBox);
        }
      } else if (_btn?.matches("#save__btn") && arrHas(templates))
        setTemplates(
          templates.map((t, i) => {
            let _t = t;
            if (i === _idx) _t = _val;
            return _t;
          }),
        );
      else if (_btn?.matches("#save__btn") && !arrHas(templates)) setTemplates([_val]);
      else if (_btn?.matches("#del__btn"))
        setTemplates(templates.length > 1 ? templates.filter((_, i) => i !== _idx) : [""]);
      else if (_btn?.matches("#add__btn") && _hasBody) setTemplates([...templates, _val]);
    },
    [inputBox, templates],
  );

  useEffect(() => {
    if (!popupVisible) return;
    const height = popupRef?.current?.clientHeight;
    if (height) popupRef.current.setAttribute("style", `top: -${height * 0.5}px;`);
  }, [popupVisible]);
  useEffect(() => {
    saveTemplatesToStore();
  }, [saveTemplatesToStore]);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const _this = e.target as HTMLElement;
      const isValid = _this && document.body.contains(_this);
      const isPopupChild = _this?.closest(".templates__popup") || _this?.closest("#templates__btn");
      if (isValid && !isPopupChild) setPopupVisible(false);
    };
    loadTemplatesFromStore();
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [loadTemplatesFromStore]);

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
