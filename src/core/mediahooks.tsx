import * as React from "react";
import { useEffect, useRef } from "react";

import { classNames, isVideo, isImage } from "./common";

declare module "react" {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        // suppress warning on scale attribute for iframes
        scale?: string;
        mute?: boolean;
    }
}

const observerOptions = {
    delay: 500,
    trackVisibility: true,
    threshold: [0, 0.95],
};
const visibilityObserver = new IntersectionObserver((changes) => {
    for (const c of changes) {
        const elem = c.target.matches("video") && (c.target as HTMLVideoElement);
        if (c.intersectionRatio >= 0.95 && elem) elem.play();
        else if (elem) elem.pause();
    }
}, observerOptions);

const vidPlaying = (v) => !!(v.currentTime > 0 && !v.paused && !v.ended && v.readyState > 2);

export const composeIframe = ({ src, postid, idx }) => {
    if (!src) return null;
    const isYoutube = src.indexOf("youtube") > -1 || src.indexOf("youtu.be") > -1;
    const isTwitch = src.indexOf("twitch.tv") > -1;
    const isStreamable = src.indexOf("streamable.com") > -1;
    const isXboxDVR = src.indexOf("xboxdvr.com") > -1;

    const id = `loader_${postid}-${idx}`;
    const classes = classNames({
        "iframe-container": !isTwitch && !isYoutube,
        "twitch-container": isTwitch,
        "yt-container": isYoutube,
    });
    return (
        <div id={id} className={classes}>
            <iframe
                width={854}
                height={480}
                title={id}
                src={src}
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                allow={isYoutube ? "autoplay; encrypted-media" : ""}
                scale={isXboxDVR || isStreamable ? "tofit" : ""}
            />
        </div>
    );
};

const Video = ({ id, classes, src, autoplay, mute, loop, controls, pauseOnClick }) => {
    const thisSlide = useRef(null);
    const onClick = (e) => {
        e.preventDefault();
        if (pauseOnClick) {
            const vid = thisSlide.current;
            if (vidPlaying(vid)) vid.pause();
            else vid.play();
        }
    };
    useEffect(() => {
        // autoplay when slide moves into view
        if (autoplay) visibilityObserver.observe(thisSlide.current);
    }, []);
    return (
        <video
            ref={thisSlide}
            id={id}
            className={classes}
            src={src}
            loop={loop}
            mute={mute.toString()}
            controls={controls}
            onClick={onClick}
        />
    );
};
const Image = ({ id, classes, src }) => <img id={id} className={classes} src={src} alt="" />;

export const composeMedia = ({ dataCallback, href, postid, idx, attrOpts }) => {
    const { classes, autoplay, loop, controls } = attrOpts || {};
    const src = useAsyncSrc(dataCallback, href, postid, idx);
    const id = `loader_${postid}-${idx}`;

    return (
        <>
            {isVideo(href) ? (
                <Video
                    key={id}
                    id={id}
                    classes={classes}
                    src={src}
                    autoplay={autoplay}
                    loop={loop}
                    controls={controls}
                />
            ) : isImage(href) ? (
                <Image key={id} id={id} classes={classes} src={src} />
            ) : null}
        </>
    );
};

const imagesEnabled = true;
const videoEnabled = false;
const socialsEnabled = false;
export const MediaDetector = (href, postid, idx) => {
    /// attempt to auto-detect a handled link
    const compose = (cb) => cb(href, postid, idx);
    return <div id={`md_${postid}-${idx}`} data-href={`${href}`} />;
    // if (imagesEnabled) {
    //   if (isChattypics(href)) return _cb(createChattpics);
    //   else if (isDropbox(href)) return _cb(createDropbox);
    //   else if (isGfycat(href)) return await _cb(createGfycat);
    //   else if (isGiphy(href)) return _cb(createGiphy);
    //   else if (isImgur(href)) return await _cb(createImgur);
    //   else if (isTenor(href)) return await _cb(createTenor);
    //   else if (isTwimg(href)) return _cb(createTwimg);
    // }
    // if (videoEnabled) {
    //   if (isFacebook(href)) return _cb(createFacebook);
    //   else if (isMixer(href)) return _cb(createMixer);
    //   else if (isStreamable(href)) return await _cb(createStreamable);
    //   else if (isTwitch(href)) return _cb(createTwitch);
    //   else if (isXboxDVR(href)) return _cb(createXboxDVR);
    //   else if (isYoutube(href)) return _cb(createYoutube);
    // }
    // if (socialsEnabled) {
    //   if (isInstagram(href)) return await _cb(createInstagram);
    //   else if (isTwitter(href)) return await _cb(createTwitter);
    // }
};
