import type { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

const useCarousel = () => {
  const options: any = { duration: 10 } as EmblaOptionsType;

  const [viewportRef, embla] = useEmblaCarousel(options);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const [firstSlideRef, setFirstSlideRef] = useState<HTMLElement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);
  const onSelect = useCallback(() => {
    if (!embla) return;
    // update our button states
    setPrevBtnEnabled(embla.canScrollPrev());
    setNextBtnEnabled(embla.canScrollNext());
    const _slides = embla.slideNodes();
    const nextSlide = embla.selectedScrollSnap();
    const selectedSlide = _slides[nextSlide];
    const selectedMedia = selectedSlide?.querySelector("img, video") as HTMLElement;
    const cHeight = selectedMedia?.clientHeight;
    const cWidth = selectedMedia?.clientWidth;
    // make Embla aware of when the media first loads
    if (!firstSlideRef && selectedMedia) setFirstSlideRef(selectedMedia);
    // try to forcefully resize the carousel container to the media's client height
    if (selectedMedia && cHeight > 0) setViewportHeight(cHeight);
    // try to intelligently handle aspect ratio issues
    if (
      (selectedMedia as HTMLImageElement)?.naturalHeight != null &&
      selectedMedia.clientHeight !== (selectedMedia as HTMLImageElement).naturalHeight
    ) {
      // by default we use "object-fit: cover" to fill width (as a compromise)
      // this will override to letterbox in case excess height would cause clipping
      selectedMedia.setAttribute("style", "object-fit: contain;");
    }
  }, [embla, firstSlideRef]);

  useEffect(() => {
    const updateSize = () => {
      if (hasLoaded) return;

      onSelect();
      if (embla) embla.reInit();
      if (!hasLoaded) setHasLoaded(true);
    };
    if (firstSlideRef?.nodeName === "IMG") firstSlideRef.addEventListener("load", updateSize);
    else if (firstSlideRef?.nodeName === "VIDEO") firstSlideRef.addEventListener("loadeddata", updateSize);

    () => {
      firstSlideRef?.removeEventListener("load", updateSize);
      firstSlideRef?.removeEventListener("loadeddata", updateSize);
    };
  }, [firstSlideRef, onSelect, embla, hasLoaded]);
  useEffect(() => {
    if (!embla) return;

    embla.on("select", onSelect);
    onSelect();

    () => {
      embla?.off("select", onSelect);
    };
  }, [embla, onSelect]);

  return {
    viewportRef,
    viewportHeight,
    prevBtnEnabled,
    nextBtnEnabled,
    scrollPrev,
    scrollNext,
  };
};
export default useCarousel;
