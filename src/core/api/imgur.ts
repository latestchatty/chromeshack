import { Dispatch } from "react";
import { imageFormats, videoFormats } from "../../builtin/image-uploader/uploaderStore";
import { arrEmpty, arrHas, isImage, isVideo } from "../common/common";
import { FormDataToJSON, matchFileFormat } from "../common/dom";
import { fetchSafe, postBackground } from "../common/fetch";

const imgurApiImageBaseUrl = "https://api.imgur.com/3/image";
const imgurApiAlbumBaseUrl = "https://api.imgur.com/3/album";
const imgurApiUploadUrl = "https://api.imgur.com/3/upload";
const imgurClientId = "Client-ID c045579f61fc802";

// wrap fetchSafe() so we can silence transmission exceptions
const _auth = { Authorization: imgurClientId };
const _fetch = async (url: string, fetchOpts?: Record<string, any>) =>
  // sanitized in common.js
  await fetchSafe({
    url,
    fetchOpts: { ...fetchOpts, headers: _auth },
  }).catch((e: Error) => console.error(e));
const _post = async (url: string, data: string, fetchOpts?: Record<string, any>) =>
  await postBackground({
    url,
    fetchOpts: { ...fetchOpts, headers: _auth },
    data,
  }).catch((e: Error) => console.error(e));

export const doResolveImgur = async ({ imageId, albumId, galleryId }: ImgurResolution) => {
  try {
    const albumImageUrl = albumId && imageId ? `${imgurApiAlbumBaseUrl}/${albumId}/image/${imageId}` : null;
    const albumUrl = albumId
      ? `${imgurApiAlbumBaseUrl}/${albumId}`
      : galleryId
        ? `${imgurApiAlbumBaseUrl}/${galleryId}`
        : null;
    // since a shortcode could be an image, album or gallery try them all
    const imageUrl = imageId
      ? `${imgurApiImageBaseUrl}/${imageId}`
      : albumId
        ? `${imgurApiImageBaseUrl}/${albumId}`
        : galleryId
          ? `${imgurApiImageBaseUrl}/${galleryId}`
          : null;

    // try all of our potential matches
    const task = (
      await Promise.all(
        [albumImageUrl, albumUrl, imageUrl].map(async (u) => {
          if (!u) return;
          const resp: ImgurResponse = await _fetch(u);
          const album = arrHas(resp?.data?.images) ? resp?.data?.images.map((i) => i?.mp4 || i?.link) : null;
          const link = resp?.data?.mp4 || resp?.data?.link || null;
          const media = isImage(link) || isVideo(link) ? [link] : null;
          return album || media || null;
        }),
      )
    ).find((t) => !!t);
    if (arrHas(task)) return task;
    throw new Error(`Could not resolve Imgur using any available method: ${imageId} ${albumId} ${galleryId}`);
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getImgur = async (...args: any[]) => {
  const [imageId, albumId, galleryId] = args || [];
  const resolved = await doResolveImgur({ imageId, albumId, galleryId });
  return arrHas(resolved)
    ? resolved.reduce(
        (acc, m) => {
          const type = isImage(m) ? "image" : isVideo(m) ? "video" : null;
          acc.push({ src: m, type });
          return acc;
        },
        [] as ImgurSource[],
      )
    : [];
};

const parseLink = (href: string) => {
  // albumMatch[1] returns an album (data.images.length > 1)
  // albumMatch[2] can also be an image nonce (data.images.length === 1 || data.link)
  const albumMatch = /https?:\/\/(?:.+?\.)?imgur\.(?:com|io)\/(?:(?:album|gallery|a|g)\/(\w+)(?:#(\w+))?)/i.exec(href);
  // galleryMatch[1] matches a tagged gallery nonce (which is actually an album)
  const galleryMatch = /https?:\/\/(?:.+?\.)?imgur\.(?:com|io)\/(?:t\/\w+\/(\w+))/i.exec(href);
  // matches an image nonce (fallthrough from the two previous types)
  // [1] = direct match, [2] = gallery direct match, [3] = indirect match, plus the albumMatch[2] above
  const imageMatch = /https?:\/\/(?:.+?\.)?imgur\.(?:com|io)\/(?:i\/(\w+)|r\/\w+\/(\w+)|(\w+)\?(i|r)|(\w+))$/i.exec(
    href,
  );

  const albumId = albumMatch ? albumMatch[1] : null;
  const galleryId = galleryMatch ? galleryMatch[1] || galleryMatch[2] : null;
  // check if we've matched an image nonce of an album first
  const imageId = albumMatch ? albumMatch[2] : imageMatch ? imageMatch[1] || imageMatch[2] || imageMatch[3] : null;

  return albumId || galleryId || imageId
    ? ({
        href,
        args: [imageId, albumId, galleryId],
        type: null,
        cb: getImgur,
      } as ParsedResponse)
    : null;
};

export const isImgur = (href: string) => parseLink(href);

const doImgurUpload = async (data: UploadData, dispatch: Dispatch<UploaderAction>) => {
  try {
    dispatch({ type: "UPLOAD_PENDING" });
    const response = [];
    for (const file of data) {
      const dataBody = new FormData();
      const fileFormat = file instanceof File ? matchFileFormat(file as File, imageFormats, videoFormats) : -1;
      // imgur demands a FormData with upload specific information
      if (typeof file === "string") dataBody.append("type", "url");
      else dataBody.append("type", "file");
      if (fileFormat === 0 || typeof file === "string") dataBody.append("image", file);
      else if (fileFormat === 1) dataBody.append("video", file);
      else throw Error(`Could not detect the file format for: ${file}`);
      const stringified = await FormDataToJSON(dataBody);
      const res: ImgurResponse = await _post(imgurApiUploadUrl, stringified);
      const deletehash = res?.data?.deletehash;
      const link = res?.data?.mp4 || res?.data?.link;
      // return our deletehash (for use on anonymous albums) and media link
      if (link) response.push({ deletehash, link });
    }
    return response;
  } catch (e) {
    console.error(e);
  }
};

const doImgurCreateAlbum = async (hashes: string[]) => {
  const dataBody =
    hashes?.length > 0
      ? hashes.reduce((acc, p) => {
          acc.append("deletehashes[]", p);
          return acc;
        }, new FormData())
      : null;
  const _fd = dataBody && (await FormDataToJSON(dataBody));
  // open a new album and add our media hashes to it
  const resp = _fd && ((await _post(imgurApiAlbumBaseUrl, _fd)) as ImgurCreateAlbumResponse);
  return resp?.data?.id ? `https://imgur.com/a/${resp.data.id}` : null;
};

const handleImgurSuccess = (payload: UploadSuccessPayload, dispatch: Dispatch<UploaderAction>) =>
  dispatch({ type: "UPLOAD_SUCCESS", payload });

const handleImgurFailure = (payload: UploadFailurePayload, dispatch: Dispatch<UploaderAction>) =>
  dispatch({ type: "UPLOAD_FAILURE", payload });

const handleImgurAlbumUpload = async (links: string[], hashes: string[], dispatch: Dispatch<UploaderAction>) => {
  if (!arrEmpty(hashes) && hashes?.length > 1) {
    const albumId = await doImgurCreateAlbum(hashes);
    if (albumId) handleImgurSuccess([albumId], dispatch);
    else handleImgurFailure({ code: 400, msg: "Something went wrong when creating album!" }, dispatch);
  } else if (hashes?.length === 1) handleImgurSuccess(links, dispatch);
  else handleImgurFailure({ code: 400, msg: "Server returned no media links!" }, dispatch);
};

export const handleImgurUpload = async (data: UploadData, dispatch: Dispatch<UploaderAction>) => {
  try {
    if (!data) return;
    const uploaded = await doImgurUpload(data, dispatch);
    const links = uploaded?.map((i) => i.link);
    const hashes = uploaded?.map((i) => i.deletehash);
    // return an album link or a media link
    await handleImgurAlbumUpload(links, hashes, dispatch);
  } catch (e) {
    if (e) console.error(e);
    handleImgurFailure({ code: 401, msg: e.message || "Something went wrong!" }, dispatch);
  }
};
