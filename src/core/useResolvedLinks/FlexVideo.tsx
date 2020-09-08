import React, { useState, useCallback, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeUp, faVolumeMute } from "@fortawesome/free-solid-svg-icons";

import { classNames } from "../common";

import type { OverlayProps, MediaProps, HTMLVideoElementWithAudio } from "./index.d";

const VolumeUpIcon = () => <FontAwesomeIcon className="unmute__icon" icon={faVolumeUp} />;
const VolumeMuteIcon = () => <FontAwesomeIcon className="mute__icon" icon={faVolumeMute} />;

export const isVidPlaying = (v: HTMLVideoElement) => !!(v.currentTime > 0 && !v.paused && !v.ended && v.readyState > 2);

const MuteOverlay = (props: OverlayProps) => {
    const { visibility, predicate, audioEnabled, onClick } = props || {};
    const _predicate = predicate !== undefined ? predicate : false;
    return (
        <>
            {!_predicate && audioEnabled ? (
                <div className="mute__overlay__container" onClick={onClick} title={visibility ? "Unmute" : "Mute"}>
                    {visibility ? <VolumeUpIcon /> : <VolumeMuteIcon />}
                </div>
            ) : null}
        </>
    );
};

const FlexVideo = (props: MediaProps) => {
    const { classes, src } = props || {};
    let { loop, muted, controls, autoPlay, clickTogglesPlay } = props || {};
    // set some sensible defaults
    if (loop === undefined) loop = true;
    if (muted === undefined) muted = true;
    if (controls === undefined) controls = false;
    if (autoPlay === undefined) autoPlay = true;
    // click-to-play/pause enabled by default
    if (clickTogglesPlay === undefined) clickTogglesPlay = true;
    const _classes = classNames(classes, { canToggle: clickTogglesPlay });

    const [muteToggle, setMuteToggle] = useState(muted);
    const [hasAudio, setHasAudio] = useState(false);
    const videoRef = useRef<HTMLVideoElementWithAudio>(null);

    // cache our handlers with useCallback to avoid re-renders
    const handleVideoState = useCallback(() => {
        const vid = videoRef.current;
        // supports Firefox and Chrome only (via their respective APIs)
        const mozHasAudio = vid?.mozHasAudio;
        const wkAudioByteCount = vid?.webkitAudioDecodedByteCount;
        const _hasAudio = vid && mozHasAudio ? mozHasAudio : vid && wkAudioByteCount > 0 ? true : false;
        if (vid && _hasAudio) setHasAudio(_hasAudio);
        else if (vid) setHasAudio(false);
    }, [videoRef]);
    const handleMuteToggle = useCallback(() => {
        const vid = videoRef.current;
        if (vid && !muteToggle && !controls) {
            vid.muted = true;
            setMuteToggle(true);
        } else if (vid && muteToggle && !controls) {
            vid.muted = false;
            setMuteToggle(false);
        }
    }, [videoRef, muteToggle, controls]);
    const handlePlayToggle = useCallback(
        (e: React.MouseEvent<HTMLVideoElement, MouseEvent>) => {
            e.preventDefault();
            if (clickTogglesPlay) {
                const vid = videoRef.current;
                if (vid && isVidPlaying(vid)) vid.pause();
                else if (vid) vid.play();
            }
        },
        [clickTogglesPlay, videoRef],
    );

    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;
        const handleVisible = (entries: IntersectionObserverEntry[]) => {
            for (const entry of entries) {
                const vid = entry.target as HTMLVideoElement;
                // play when visible - pause when not-visible
                if (entry.intersectionRatio > 0.66) vid.play();
                else vid.pause();
            }
        };
        const observerOpts = {
            threshold: 0.66,
            delay: 500,
            trackVisibility: true,
        };
        const observer = new IntersectionObserver(handleVisible, observerOpts);
        observer.observe(vid);
    }, [videoRef]);

    return (
        <div className="media__boundary">
            <MuteOverlay
                predicate={controls}
                visibility={muteToggle}
                audioEnabled={hasAudio}
                onClick={handleMuteToggle}
            />
            <video
                key={src}
                ref={videoRef}
                className={_classes}
                src={src}
                loop={loop}
                muted={muted}
                controls={controls}
                autoPlay={autoPlay}
                onClick={handlePlayToggle}
                // onPlaying is required to detect audio in Chrome
                onPlaying={handleVideoState}
                // onLoadedData is required to detect audio in Firefox
                onLoadedData={handleVideoState}
            />
        </div>
    );
};

export default FlexVideo;
