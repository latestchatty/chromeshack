import React, { useEffect, useState, useCallback, createRef } from "react";
import { useEmblaCarousel } from "embla-carousel/react";

import { arrHas } from "../../core/common";

import { PrevButton, NextButton } from "./CarouselButtons";
import { EmblaCarousel } from "embla-carousel/vanilla";

require("../../styles/embla.css");

const EmblaSlide = (props: { children: React.ReactNode }) => {
    const { children } = props || {};
    return (
        <div className="embla__slide">
            <div className="embla__slide__inner">{children}</div>
        </div>
    );
};

const Carousel = (props: { slides: React.ReactNode[] }) => {
    const { slides } = props || {};

    const [viewportRef, embla] = useEmblaCarousel();
    const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
    const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
    const [children, setChildren] = useState<React.ReactNode[]>();

    const adjustSlideHeight = useCallback(() => {
        if (!embla) return;
        // update our button states
        setPrevBtnEnabled(embla.canScrollPrev());
        setNextBtnEnabled(embla.canScrollNext());
        const slideNodes = embla.slideNodes();
        const visibleSlides = embla.slidesInView();
        const selectedSlide = slideNodes[visibleSlides[visibleSlides.length - 1]];
        const emblaContainer = selectedSlide?.closest(".embla");
        const selectedMedia = selectedSlide?.querySelector("img, video") as HTMLElement;
        const cHeight = selectedMedia?.clientHeight;
        // try to forcefully resize the carousel container to the media's client height
        if (selectedSlide) emblaContainer?.setAttribute("style", `height: ${cHeight}px;`);
    }, [embla]);
    const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla]);
    const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla]);
    const onSelect = () => {
        adjustSlideHeight();
    };
    const onResize = () => {
        adjustSlideHeight();
    };

    useEffect(() => {
        if (!embla) return;
        embla.on("settle", onSelect);
        embla.on("resize", onResize);
        onSelect();
    }, [embla, onSelect, onResize]);
    useEffect(() => {
        const _children =
            slides &&
            (slides.reduce((acc: React.ReactNode[], c, i) => {
                if (c) acc.push(<EmblaSlide key={i}>{c}</EmblaSlide>);
                return acc;
            }, []) as React.ReactNode[]);
        if (arrHas(_children)) setChildren(_children);
    }, []);

    return (
        <div className="embla">
            <div className="embla__viewport" ref={viewportRef}>
                <div className="embla__container">{children}</div>
            </div>
            <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
            <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
        </div>
    );
};
export default Carousel;
