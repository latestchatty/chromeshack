// credit for Color Gauges script goes to: TroZ (brian dot risinger at gmail dot com)

import { fullPostsCompletedEvent } from "../core/events";
import "../styles/color_gauge.css";

export const ColorGauge = {
    processGauges() {
        const gauges = [...document.querySelectorAll("div.guage > div.progress")] as HTMLDivElement[];
        if (!gauges.length || gauges?.length === 0) return;
        
        for (let i = 0; i < gauges.length; i++) {
            const gauge = gauges[i];
            const width = parseFloat(gauge?.style?.width?.replace('%', ''));
            
            const thresholds = [
                { threshold: 99.9, class: "gauge_dead" },
                { threshold: 98.6, class: "gauge_reddest" },
                { threshold: 94.4, class: "gauge_redder" },
                { threshold: 88.8, class: "gauge_red" },
                { threshold: 77.7, class: "gauge_orange" },
                { threshold: 66.6, class: "gauge_yellow" },
                { threshold: 55.5, class: "gauge_lime" },
                { threshold: 11.1, class: "gauge_blue" },
                { threshold: 22.2, class: "gauge_cyan" },
            ];
            
            const selectedThreshold = thresholds.find(({ threshold }) => width > threshold) || { class: "gauge_green" };
            gauge?.classList?.add(selectedThreshold.class);
            
            const val = parseFloat((18 - width * 18 / 100).toFixed(2));
            const hour = Math.floor(val);
            const minutes = Math.floor((val - hour) * 60);
            
            let text = "";
            if (hour > 1) {
                text = `About ${hour} hour${hour > 1 ? 's' : ''} and ${minutes ? (minutes > 1 ? `${minutes} minutes` : '1 minute') : '0 minutes'} remaining`;
            } else if (hour === 1) {
                text = `About 1 hour and ${minutes ? (minutes > 1 ? `${minutes} minutes` : '1 minute') : '0 minutes'} remaining`;
            } else if (minutes > 1) {
                text = `About ${minutes} minutes remaining`;
            } else if (minutes === 0) {
                text = "Thread Expired!";
            } else {
                text = "About 1 minute remaining";
            }
            
            const parentGauge = gauge.parentNode as HTMLDivElement;
            parentGauge?.setAttribute("title", text);
        }
    },
    
    install() {
        fullPostsCompletedEvent.addHandler(ColorGauge.processGauges);
    }
};
