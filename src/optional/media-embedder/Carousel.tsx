import React, { useEffect, useState, useCallback } from "react";
import { useEmblaCarousel } from "embla-carousel/react";

import { arrHas } from "../../core/common";
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

const loadSlides = (slides: React.ReactNode[]) => {
    return arrHas(slides)
        ? slides.reduce((acc: React.ReactNode[], c, i) => {
              acc.push(<EmblaSlide key={i}>{c}</EmblaSlide>);
              return acc;
          }, [] as React.ReactNode[])
        : null;
};

export const Carousel = (props: { slides: React.ReactNode[] }) => {
    const { slides } = props || {};

    const [viewportRef, embla] = useEmblaCarousel();
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

    const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
    const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);

    useEffect(() => {
        if (!embla) return;
        const onSelect = () => {
            if (!embla) return;
            // update our button states
            setPrevBtnEnabled(embla.canScrollPrev());
            setNextBtnEnabled(embla.canScrollNext());
            setTimeout(() => {
                const slideNodes = embla.slideNodes();
                const visibleSlides = embla.slidesInView();
                const selectedSlide = slideNodes[visibleSlides[visibleSlides.length - 1]] || slideNodes[0];
                const emblaContainer = selectedSlide?.closest(".embla");
                const selectedMedia = selectedSlide?.querySelector("img, video") as HTMLElement;
                const cHeight = selectedMedia?.clientHeight;
                // try to forcefully resize the carousel container to the media's client height
                if (selectedSlide && cHeight > 0) emblaContainer?.setAttribute("style", `height: ${cHeight}px;`);
            }, 210);
        };
        embla.on("select", onSelect);
        embla.on("settle", onSelect);
        embla.on("resize", onSelect);
        onSelect();
    }, [embla]);

    return (
        slides && (
            <div className="embla">
                <div className="embla__viewport" ref={viewportRef}>
                    <div className="embla__container">{loadSlides(slides)}</div>
                </div>
                <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
                <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
            </div>
        )
    );
};
