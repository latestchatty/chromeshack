import React, { memo, useEffect, useRef, useState } from "react";
import { classNames } from "../core/common/common";
import { getSetting, setSetting } from "../core/settings";

const isChromeBrowser = !!window.browser;

const storeActiveTab = async (idx: number) =>
  await setSetting("selected_popup_tab", idx);
const getActiveTabFromStore = async () =>
  await getSetting("selected_popup_tab", 0);

const Tabs = memo((props: { children?: JSX.Element[] }) => {
  const { children } = props || {};
  const bodyRef = useRef(null);
  const classDefaults = useRef({
    firefox__padding: !isChromeBrowser,
    chrome__padding: isChromeBrowser,
    long: false,
  }).current;

  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [classes, setClasses] = useState(classNames(classDefaults));

  useEffect(() => {
    if (!bodyRef.current) return;
    const bodyHeight = (bodyRef.current as HTMLElement).offsetHeight;
    if (bodyHeight > 499)
      setClasses(classNames({ ...classDefaults, long: true }));
    else setClasses(classNames({ ...classDefaults, long: false }));
  }, [activeTabIdx, classDefaults]);
  useEffect(() => {
    (async () => {
      const _tabIdx = ((await getActiveTabFromStore()) as number) || 0;
      setActiveTabIdx(_tabIdx);
    })();
  }, []);

  return (
    <div className={classes}>
      <div className="tabs">
        {children.map((c, i) => {
          return (
            <button
              key={i}
              className={classNames("tab__btn", { active: activeTabIdx === i })}
              onClick={() => {
                setActiveTabIdx(i);
                storeActiveTab(i);
              }}
            >
              {c.props.title}
            </button>
          );
        })}
      </div>
      <div className="tab-indicator__container">
        <div
          className="tab-indicator"
          style={{
            width: `${100 / children.length}%`,
            transform: `translateX(${activeTabIdx * 100}%)`,
          }}
        />
      </div>
      <div className="tabs-body" ref={bodyRef}>
        {children?.[activeTabIdx]?.props?.children}
      </div>
    </div>
  );
});

export { Tabs };
