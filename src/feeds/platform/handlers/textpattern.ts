import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Textpattern serves RSS at `/rss` and Atom at `/atom` on the site root.

export const isTextpatternHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Textpattern')
}

export const textpatternHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isTextpatternHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [
        { uri: `${origin}/rss`, hint: composeHint('textpattern:posts-rss') },
        { uri: `${origin}/atom`, hint: composeHint('textpattern:posts-atom') },
      ]
    } catch {}

    return []
  },
}
