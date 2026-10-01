import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export const isTextpatternHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Textpattern')
}

export const textpatternHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isTextpatternHtml })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/rss`, hint: composeHint('textpattern:posts', 'rss') },
      { uri: `${origin}/atom`, hint: composeHint('textpattern:posts', 'atom') },
    ]
  },
}
