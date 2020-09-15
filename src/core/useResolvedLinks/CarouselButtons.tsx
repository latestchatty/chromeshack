import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

const ChevronLeft = () => <FontAwesomeIcon className="embla__button__svg right" icon={faChevronLeft} />;
export const PrevButton = ({ enabled, onClick }: { enabled: boolean; onClick: any }) => (
    <button className="embla__button embla__button--prev" onClick={onClick} disabled={!enabled}>
        <ChevronLeft />
    </button>
);

const ChevronRight = () => <FontAwesomeIcon className="embla__button__svg right" icon={faChevronRight} />;
export const NextButton = ({ enabled, onClick }: { enabled: boolean; onClick: any }) => (
    <button className="embla__button embla__button--next" onClick={onClick} disabled={!enabled}>
        <ChevronRight />
    </button>
);
