import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "ts-debounce";
import { useIntersectObserver } from "../../core/useResolvedLinks/useIntersectObserver";

const useHeaderObserver = (headerEl: HTMLElement, targetEl: HTMLElement) => {
  const [isNarrow, setIsNarrow] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  // use an IntersectionObserver to monitor the visibility of the header
  const { isVisible, setObservedElem } = useIntersectObserver({ delay: 100, trackVisibility: true }) || {};
  // use a debounced scroll handler to detect when the header minimizes by scrolling in wide-mode
  const headerScrolled = useCallback(() => {
    const _threshold = headerEl?.clientHeight;
    if (window.scrollY > _threshold) setHasScrolled(true);
    else setHasScrolled(false);
  }, [headerEl]);
  const debounceScroll = useRef(debounce((_: Event) => headerScrolled(), 100)).current;
  useEffect(() => {
    if (!targetEl || !headerEl) return;
    setObservedElem(headerEl as HTMLElement);
    // monitor media-query max-width state since the page doesn't report this
    const narrowMatch = window.matchMedia("(max-width: 1024px)");
    setIsNarrow(narrowMatch.matches);
    headerScrolled();
    function handleNarrow(this: MediaQueryList, _: MediaQueryListEvent) {
      if (this.matches) setIsNarrow(true);
      else setIsNarrow(false);
    }
    const handleScroll = (e: Event) => debounceScroll(e);
    window.addEventListener("scroll", handleScroll);
    narrowMatch.addEventListener("change", handleNarrow);
    return () => {
      setObservedElem(null);
      narrowMatch.removeEventListener("change", handleNarrow);
    };
  }, [headerEl, targetEl, setObservedElem, headerScrolled, debounceScroll]);
  return { isNarrow, isVisible, hasScrolled };
};
export { useHeaderObserver };
