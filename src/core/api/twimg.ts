import { isImage, isVideo } from "../common/common";

const parseLink = (href: string) => {
	const isTwimg =
		/(https?:\/\/(?:.+\.)?twimg\.com\/media\/)(?:([\w-]+)\?format=([\w]+)&?|([\w-.]+))?/i.exec(
			href,
		);
	const src = isTwimg?.[3]
		? `${isTwimg[1]}${isTwimg[2]}.${isTwimg[3]}`
		: isTwimg
		  ? `${isTwimg[1]}${isTwimg[4]}`
		  : null;
	const type = isVideo(src)
		? { type: "video" }
		: isImage(src)
		  ? { type: "image" }
		  : null;
	return type ? ({ ...type, href, src } as ParsedResponse) : null;
};

export const isTwimg = (href: string) => parseLink(href);
