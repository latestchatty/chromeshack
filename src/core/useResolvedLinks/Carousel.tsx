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

export const Carousel = (props: { slides: React.ReactNode[] }) => {
    const { slides } = props || {};

    const [viewportRef, embla] = useEmblaCarousel();
    const [viewportHeight, setViewportHeight] = useState(0);
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

    const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
    const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);
    const onSelect = useCallback(() => {
        // update our button states
        setPrevBtnEnabled(embla.canScrollPrev());
        setNextBtnEnabled(embla.canScrollNext());
        const slides = embla.slideNodes();
        const nextSlide = embla.selectedScrollSnap();
        const selectedSlide = slides[nextSlide];
        const selectedMedia = selectedSlide?.querySelector("img, video") as HTMLElement;
        const cHeight = selectedMedia?.clientHeight;
        // try to forcefully resize the carousel container to the media's client height
        if (selectedMedia && cHeight > 0) setViewportHeight(cHeight);
    }, [embla]);

    useEffect(() => {
        if (!embla) return;
        embla.on("init", onSelect);
        embla.on("select", onSelect);
        setTimeout(() => embla.reInit(), 0);
    }, [embla, onSelect]);

    return (
        <div className="embla">
            <div className="embla__viewport" ref={viewportRef} style={{ height: viewportHeight }}>
                <div className="embla__container">
                    {arrHas(slides) && slides.map((s, i) => <EmblaSlide key={i}>{s}</EmblaSlide>)}
                </div>
            </div>
            <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
            <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
        </div>
    );
};
