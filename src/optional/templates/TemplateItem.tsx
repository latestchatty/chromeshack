import { faCheck, faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo } from "react";
import { classNames } from "../../core/common/common";

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
        onClick={onClick}>
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
        disabled={isDefaultArr}>
        <DelIcon />
      </button>
      <button
        id="add__btn"
        className="template__btn"
        title={hasBody ? "Add as a new template slot" : ""}
        onClick={onClick}
        disabled={isDefaultArr || !hasBody}>
        <AddIcon />
      </button>
    </div>
  );
});

export default TemplateItem;
