import { useEffect, useState, useRef } from "react";

import type { IntersectionObserverConfig } from "./index.d";

const useIntersectObserver = (config: IntersectionObserverConfig) => {
    const { root = null, threshold = 0.5, ...configOpts } = config || {};

    const [entry, setEntry] = useState<IntersectionObserverEntry>(null);
    const [observedElem, setObservedElem] = useState<HTMLElement>(null);
    const observer = useRef<IntersectionObserver>(null);

    useEffect(() => {
        if (!observedElem) return;
        // disconnect previous before reattach (for safety)
        observer.current?.disconnect();
        const config = {
            root,
            threshold,
            ...configOpts,
        };
        observer.current = new IntersectionObserver(([e]) => setEntry(e), config);
        // avoid dropping our ref
        const _observer = observer.current;
        if (observedElem) _observer.observe(observedElem);
        // make sure we clean up after ourselves
        return () => _observer.disconnect();
    }, [observedElem, root, threshold]);
    // expose an element setter and our intersect entries
    return { setObservedElem, entry };
};

export default useIntersectObserver;
