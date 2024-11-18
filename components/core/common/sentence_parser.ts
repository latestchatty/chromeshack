import { stripHtml, superTrim } from "./dom";

const LINK_REGEX = /<a.*?href=("|')(.*?)([\n|\r]*?)("|').*?>(.*?)([\n|\r]*?)<\/a>/gim;
const SPOILER_REGEX = /<span class="jt_spoiler" onclick="return doSpoiler\( event \);">(|.|\r|\n)*?<\/span>/i;
const SENTENCE_REGEX = /.+?(!|\.(?!\w|\.|\])|\?|$)+/gm;

const LINK_PLACEHOLDER = "%%link%%";
const SPOILER_PLACEHOLDER = "%%spoiler%%";

export const SentenceParser = {
  extractElements(html: string, regex: RegExp): string[] {
    return html.match(regex)!;
  },

  replacePlaceholders(text: string, placeholder: string, replacements: string[]): string {
    return text.replace(new RegExp(placeholder, "gi"), () => replacements.shift() || "");
  },

  cleanHtml(html: string): string {
    return html.replace(LINK_REGEX, LINK_PLACEHOLDER).replace(SPOILER_REGEX, SPOILER_PLACEHOLDER);
  },

  processSentences(post: string, links: string[], spoilers: string[]): string[] {
    return post.match(SENTENCE_REGEX)!.reduce((acc: string[], sentence: string) => {
      const trimmedSentence = superTrim(sentence);
      if (trimmedSentence) {
        let processedSentence = this.replacePlaceholders(trimmedSentence, SPOILER_PLACEHOLDER, spoilers);
        processedSentence = this.replacePlaceholders(processedSentence, LINK_PLACEHOLDER, links);
        acc.push(processedSentence);
      }
      return acc;
    }, []);
  },

  parseIntoLines(html: string): string[] {
    const links = this.extractElements(html, LINK_REGEX);
    const spoilers = this.extractElements(html, SPOILER_REGEX);
    const cleanedHtml = this.cleanHtml(html);
    const post = stripHtml(cleanedHtml);
    const sentences = this.processSentences(post, links, spoilers);

    return sentences;
  },
};
