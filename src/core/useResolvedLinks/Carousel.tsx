import React, { useEffect, useState, useCallback } from "react";
import { useEmblaCarousel } from "embla-carousel/react";

import { arrHas } from "../common";
import { PrevButton, NextButton } from "./CarouselButtons";

require("../../styles/embla.css");

const EmblaSlide = (props: { children: React.ReactNode }) => {
    const { children } = props || {};
    return (
        <div className="embla__slide">
            <div className="embla__slide__inner">{children}</div>
        </div>
    );
};

const EmblaSlides = (props: { slides: React.ReactNode[] }) => {
    const { slides } = props || {};
    return <>{arrHas(slides) && slides.map((s, i) => <EmblaSlide key={i}>{s}</EmblaSlide>)}</>;
};

export const Carousel = (props: { slides: React.ReactNode[] }) => {
    const { slides } = props || {};

    const [viewportRef, embla] = useEmblaCarousel({ speed: 30 });
    const [viewportHeight, setViewportHeight] = useState(0);
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

    const [firstSlideRef, setFirstSlideRef] = useState(null as HTMLElement);
    const [hasLoaded, setHasLoaded] = useState(false);

    const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
    const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);
    const onSelect = useCallback(() => {
        // update our button states
        setPrevBtnEnabled(embla.canScrollPrev());
        setNextBtnEnabled(embla.canScrollNext());
        const _slides = embla.slideNodes();
        const nextSlide = embla.selectedScrollSnap();
        const selectedSlide = _slides[nextSlide];
        const selectedMedia = selectedSlide?.querySelector("img, video") as HTMLElement;
        const cHeight = selectedMedia?.clientHeight;
        // make Embla aware of when the media first loads
        if (!firstSlideRef && selectedMedia) setFirstSlideRef(selectedMedia);
        // try to forcefully resize the carousel container to the media's client height
        if (selectedMedia && cHeight > 0) setViewportHeight(cHeight);
    }, [embla, firstSlideRef]);

    useEffect(() => {
        const updateSize = () => {
            if (hasLoaded) return;

            onSelect();
            if (embla) embla.reInit();
            if (!hasLoaded) setHasLoaded(true);
        };
        if (firstSlideRef && firstSlideRef.nodeName === "IMG") firstSlideRef.addEventListener("load", updateSize);
        else if (firstSlideRef && firstSlideRef.nodeName === "VIDEO")
            firstSlideRef.addEventListener("loadeddata", updateSize);
    }, [firstSlideRef, onSelect, embla, hasLoaded]);
    useEffect(() => {
        if (!embla) return;

        embla.on("select", onSelect);
        onSelect();
    }, [embla, onSelect]);

    return (
        <div className="embla">
            <div className="embla__viewport" ref={viewportRef} style={{ height: viewportHeight }}>
                <div className="embla__container">
                    <EmblaSlides slides={slides} />
                </div>
            </div>
            <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
            <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
        </div>
    );
};
