import { useEffect, useRef, useState } from "react";

export const useIntersectObserver = (config: IntersectionObserverConfig) => {
  const { root = null, threshold = 0.5, ...configOpts } = config || {};

  const [isVisible, setIsVisible] = useState(false);
  const [observedElem, setObservedElem] = useState<HTMLElement>(null);
  const observer = useRef<IntersectionObserver>(null);

  useEffect(() => {
    if (!observedElem) return;
    // disconnect previous before reattach (for safety)
    observer.current?.disconnect();
    const _config = {
      root,
      threshold,
      ...configOpts,
    };
    // only expose the boolean state of the visibility threshold (for ease of use)
    observer.current = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) setIsVisible(true);
      else setIsVisible(false);
    }, _config);
    // avoid dropping our ref
    const _observer = observer.current;
    if (observedElem) _observer.observe(observedElem);
    // make sure we clean up after ourselves
    return () => _observer.disconnect();
  }, [config, configOpts, observedElem, root, threshold]);
  // expose an element setter and our boolean visibility state
  return { observedElem, setObservedElem, isVisible };
};
