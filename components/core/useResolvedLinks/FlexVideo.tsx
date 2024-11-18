import { faVolumeMute, faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { classNames } from "../common/common";
import { useIntersectObserver } from "./useIntersectObserver";

const VolumeUpIcon = () => <FontAwesomeIcon className="unmute__icon" icon={faVolumeUp} />;
const VolumeMuteIcon = () => <FontAwesomeIcon className="mute__icon" icon={faVolumeMute} />;

export const isVidPlaying = (v: HTMLVideoElement) => !!(v.currentTime > 0 && !v.paused && !v.ended && v.readyState > 2);

const MuteOverlay = (props: OverlayProps) => {
  const { visibility, predicate, audioEnabled, onClick } = props || {};
  const _predicate = predicate !== undefined ? predicate : false;
  return _predicate && audioEnabled ? (
    <div className="mute__overlay__container" onClick={onClick} title={visibility ? "Unmute" : "Mute"}>
      {visibility ? <VolumeUpIcon /> : <VolumeMuteIcon />}
    </div>
  ) : null;
};

const FlexVideo = (props: MediaProps) => {
  const { classes, src } = props || {};
  // set some sensible defaults
  const { loop = true, muted = true, controls = false, autoPlay = true, clickTogglesPlay = true } = props || {};
  const _classes = classNames(classes, { canToggle: clickTogglesPlay });
  const isFirefox = !window.chrome;

  const [muteToggle, setMuteToggle] = useState(muted);
  const [wasPaused, setWasPaused] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const videoRef = useRef<HTMLVideoElementWithAudio>(null);
  // visibility threshold before firing play/pause event
  const { observedElem, setObservedElem, isVisible } = useIntersectObserver({
    threshold: 0.66,
    delay: 500,
    trackVisibility: true,
  });

  const handleMuteToggle = () => {
    const vid = videoRef.current as HTMLVideoElementWithAudio;
    if (vid && !muteToggle) {
      vid.muted = true;
      setMuteToggle(true);
    } else if (vid) {
      vid.muted = false;
      setMuteToggle(false);
    }
  };
  const handleVideoState = () => {
    const vid = videoRef.current as HTMLVideoElementWithAudio;
    // supports Firefox and Chrome only (via their respective APIs)
    const mozHasAudio = vid?.mozHasAudio;
    const wkAudioByteCount = vid?.webkitAudioDecodedByteCount ?? 0;
    const _hasAudio = vid && mozHasAudio ? mozHasAudio : !!(vid && wkAudioByteCount > 0);
    if (vid && _hasAudio) setHasAudio(_hasAudio);
    else if (vid) setHasAudio(false);
  };
  const handlePlayToggle = (e: React.MouseEvent<HTMLVideoElement, MouseEvent>) => {
    const vid = e?.target as HTMLVideoElementWithAudio;
    if (vid && clickTogglesPlay && isVidPlaying(vid)) {
      vid.pause();
      setWasPaused(true);
    } else if (vid && clickTogglesPlay && !isVidPlaying(vid)) {
      vid.play();
      setWasPaused(false);
    }
  };

  useEffect(() => {
    // setup visibility observer
    const vid = videoRef.current;
    if (vid && !observedElem) setObservedElem(vid);
  }, [observedElem, setObservedElem]);
  useEffect(() => {
    const _vid = observedElem as HTMLVideoElementWithAudio;
    if (_vid && isVisible && !wasPaused) _vid.play();
    else if (_vid) _vid.pause();
  }, [observedElem, isVisible, wasPaused]);

  return (
    <div className="media__boundary" style={isFirefox ? { position: "relative" } : undefined}>
      <MuteOverlay
        predicate={isFirefox || !controls}
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
        // controls conflict with onClick events on Firefox
        controls={!isFirefox ? controls : false}
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

export { FlexVideo };
