import {
	faCompressAlt,
	faExpandAlt,
	faExternalLinkAlt,
	faRedoAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
	isValidElement,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { classNames, getLinkType } from "../../core/common/common";
import { elemMatches } from "../../core/common/dom";
import { resolveChildren } from "../../core/useResolvedLinks";

const ExpandIcon = () => (
	<FontAwesomeIcon className="expand__icon" icon={faExpandAlt} />
);
const CompressIcon = () => (
	<FontAwesomeIcon className="compress__icon" icon={faCompressAlt} />
);
const ExternalLink = () => (
	<FontAwesomeIcon className="external__icon" icon={faExternalLinkAlt} />
);
export const RefreshIcon = ({ classes }: { classes: string }) => (
	<FontAwesomeIcon className={classes} icon={faRedoAlt} />
);

const Expando = memo((props: ExpandoProps) => {
	const { response, options } = props || {};
	const { href, src, type: _type } = response || {};
	const { openByDefault } = options || {};

	const [toggled, setToggled] = useState(openByDefault || false);
	const [children, setChildren] = useState(null as JSX.Element);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [type, setType] = useState(_type as string);
	const newTabHref = useRef(href || src);

	const expandoClasses = classNames("medialink", { toggled });
	const mediaClasses = classNames("media", { hidden: !toggled });
	const reloadClasses = classNames("refresh__icon", { loading: hasLoaded });

	const loadChildren = useCallback(() => {
		(async () => {
			const _children = await resolveChildren({ response, options });
			const __type = _children?.props?.src && getLinkType(_children.props.src);
			if (_children) {
				setChildren(_children);
				setHasLoaded(true);
			}
			if (__type) setType(__type);
		})();
	}, [response, options]);
	const handleToggleClick = useCallback(
		(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
			e.preventDefault();
			const _this = e?.target as HTMLElement;
			const _mediaParent = type === "image" && elemMatches(_this, "img");
			const _expando =
				!_this?.closest("div.media") && _this?.closest("div.medialink");
			// only clickTogglesVisible on media when an image or expando link
			if ((_mediaParent && type === "image" && toggled) || _expando)
				setToggled(!toggled);
		},
		[type, toggled],
	);
	const handleNewClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
			e.preventDefault();
			const newWindow = window.open(
				newTabHref?.current,
				"_blank",
				"noopener,noreferrer",
			);
			if (newWindow) newWindow.opener = null;
		},
		[],
	);
	const handleRefreshClick = useCallback(() => {
		// less graceful reload method
		setHasLoaded(false);
		setChildren(null as JSX.Element);
		// use a delay so we see the animation each time
		setTimeout(() => {
			loadChildren();
			// should be visible?
			if (children) setToggled(true);
		}, 100);
	}, [children, loadChildren]);

	useEffect(() => {
		if (toggled) loadChildren();
	}, [toggled, loadChildren]);

	return (
		<div className={expandoClasses} onClick={handleToggleClick}>
			<a
				href={src || href}
				title={toggled ? "Hide embedded media" : "Show embedded media"}
			>
				<span>{href || src}</span>
				<div className="expando">
					{toggled ? <CompressIcon /> : <ExpandIcon />}
				</div>
			</a>
			{isValidElement(children) && (
				<a
					className="reloadbtn"
					title="Reload embed"
					onClick={handleRefreshClick}
				>
					<RefreshIcon classes={reloadClasses} />
				</a>
			)}
			<a
				className="expandbtn"
				title="Open in new tab"
				href={newTabHref?.current || ""}
				onClick={handleNewClick}
			>
				<ExternalLink />
			</a>
			<div className={mediaClasses} onClick={handleToggleClick}>
				{toggled ? children : null}
			</div>
		</div>
	);
});

export { Expando };
