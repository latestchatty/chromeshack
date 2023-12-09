import { stripHtml, superTrim } from "./dom";

export const SentenceParser = {
  parseIntoLines(html: string) {
    let _html = html;
    const LINK_PLACEHOLDER = "%%link%%";
    const SPOILER_PLACEHOLDER = "%%spoiler%%";
    // Extract all the links, store them in links[] and replace the link with a %%link%% placeholder in the post
    const link_regex = new RegExp(/<a.*? href=("|')(.*?)([\n|\r]*?)("|').*?>(.*?)([\n|\r]*?)<\/a>/gim);
    const links = html.match(link_regex);
    _html = html.replace(link_regex, LINK_PLACEHOLDER);
    // Extract all the spoilers, store them in spoilers[] and replace the spoilers with a %%spoiler%% placeholder in the post
    const spoiler_regex = new RegExp(
      /<span class="jt_spoiler" onclick="return doSpoiler\( event \);">(|.|\r|\n)*?<\/span>/i,
    );
    const spoilers = html.match(spoiler_regex);
    _html = html.replace(spoiler_regex, SPOILER_PLACEHOLDER);
    // remove the rest of the html from the post
    const post = stripHtml(html);
    // match a sentence as:
    // 1. anything (non-greedy)
    // 2. one or more punctuation (unless it is a . followed by a number, letter, another . or a ]), or the end of the line
    const sentence_regex = new RegExp(/.+?(!|\.(?!\w|\.|\])|\?|$)+/gm);
    const link_replace_regex = new RegExp(LINK_PLACEHOLDER, "i");
    const spoiler_replace_regex = new RegExp(SPOILER_PLACEHOLDER, "i");
    const sentences: string[] = [];
    // Get sentences from paragraphs
    const matches = post.match(sentence_regex);
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      let tmp = superTrim(match);
      if (tmp?.length > 0) {
        // replace placeholders with items
        // do spoilers first, because spoilers could contain links!
        while (tmp.indexOf(SPOILER_PLACEHOLDER) >= 0 && spoilers?.length > 0)
          tmp = tmp.replace(spoiler_replace_regex, spoilers.shift());

        while (tmp.indexOf(LINK_PLACEHOLDER) >= 0 && links?.length > 0)
          tmp = tmp.replace(link_replace_regex, links.shift());

        sentences.push(tmp);
      }
    }
    return sentences;
  },
};
