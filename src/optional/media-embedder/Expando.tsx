import { faCompressAlt, faExpandAlt, faExternalLinkAlt, faRedoAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isValidElement, memo } from "react";
import { classNames } from "../../core/common/common";
import useExpando from "./useExpando";

const ExpandIcon = () => <FontAwesomeIcon className="expand__icon" icon={faExpandAlt} />;
const CompressIcon = () => <FontAwesomeIcon className="compress__icon" icon={faCompressAlt} />;
const ExternalLink = () => <FontAwesomeIcon className="external__icon" icon={faExternalLinkAlt} />;
export const RefreshIcon = ({ classes }: { classes: string }) => (
  <FontAwesomeIcon className={classes} icon={faRedoAlt} />
);

const Expando = memo((props: ExpandoProps) => {
  const { handleToggleClick, handleNewClick, handleRefreshClick, newTabHref, children, hasLoaded, toggled, src, href } =
    useExpando(props);

  const expandoClasses = classNames("medialink", { toggled });
  const mediaClasses = classNames("media", { hidden: !toggled });
  const reloadClasses = classNames("refresh__icon", { loading: hasLoaded });

  return (
    <div className={expandoClasses} onClick={handleToggleClick}>
      <a href={src || href} title={toggled ? "Hide embedded media" : "Show embedded media"}>
        <span>{href || src}</span>
        <div className="expando">{toggled ? <CompressIcon /> : <ExpandIcon />}</div>
      </a>
      {isValidElement(children) && (
        <a className="reloadbtn" title="Reload embed" onClick={handleRefreshClick}>
          <RefreshIcon classes={reloadClasses} />
        </a>
      )}
      <a className="expandbtn" title="Open in new tab" href={newTabHref || ""} onClick={handleNewClick}>
        <ExternalLink />
      </a>
      <div className={mediaClasses} onClick={handleToggleClick}>
        {toggled ? children : null}
      </div>
    </div>
  );
});

export { Expando };
