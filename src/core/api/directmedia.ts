import { isImage, isVideo } from "../common/common";

const parseLink = (href: string) => {
	const mediaMatch =
		/https?:\/\/.+?\/([\w\-._@#$%^&!()[\]{}+']+\.(?:png|jpe?g|web[mp]|gifv?|mp4))(?:[&?]?.+|$)/i.exec(
			href,
		);
	const type =
		mediaMatch && isImage(mediaMatch[1])
			? "image"
			: mediaMatch && isVideo(mediaMatch[1])
			  ? "video"
			  : null;
	return mediaMatch
		? ({ href, src: mediaMatch[0], type } as ParsedResponse)
		: null;
};

export const isDirectMedia = (href: string) => parseLink(href);
