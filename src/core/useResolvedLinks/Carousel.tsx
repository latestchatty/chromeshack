import "../../styles/embla.css";
import { arrHas } from "../common/common";
import { NextButton, PrevButton } from "./CarouselButtons";
import useCarousel from "./useCarousel";

const EmblaSlide = (props: { children: React.ReactNode }) => {
  const { children } = props || {};
  return <div className="embla__slide">{children}</div>;
};

const EmblaSlides = (props: { slides: React.ReactNode[] }) => {
  const { slides } = props || {};
  return <>{arrHas(slides) && slides.map((s, i) => <EmblaSlide key={i}>{s}</EmblaSlide>)}</>;
};

const Carousel = (props: { slides: React.ReactNode[] }) => {
  const { slides } = props || {};
  const { viewportRef, viewportHeight, prevBtnEnabled, nextBtnEnabled, scrollPrev, scrollNext } =
    useCarousel();

  return (
    <div className="embla">
      <div
        className="embla__viewport"
        ref={viewportRef}
        style={{ height: viewportHeight }}>
        <div className="embla__container">
          <EmblaSlides slides={slides} />
        </div>
        <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
        <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
      </div>
    </div>
  );
};

export { Carousel };
