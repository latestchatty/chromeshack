import React, { useEffect, useState } from "react";
import { classNames } from "../core/common";
import { getSetting, setSetting } from "../core/settings";

const Tabs = (props: { children?: JSX.Element[] }) => {
    const { children } = props || {};
    const [activeTabIdx, setActiveTabIdx] = useState(0);
    const activeTab = children[activeTabIdx];

    const storeActiveTab = async (idx: number) => await setSetting("selected_popup_tab", idx);
    const getActiveTabFromStore = async () => await getSetting("selected_popup_tab", 0);

    useEffect(() => {
        (async () => {
            const _tabIdx = await getActiveTabFromStore();
            setActiveTabIdx(_tabIdx);
        })();
    }, []);

    return (
        <>
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
                ></div>
            </div>
            <div className="tabs-body">{activeTab.props.children}</div>
        </>
    );
};

export { Tabs };
