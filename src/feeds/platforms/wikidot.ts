import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export const isWikidotHtml = (content: string): boolean => {
  return content.includes('WIKIDOT.page.listeners.editClick()')
}

export const wikidotHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isWikidotHtml })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/feed/site-changes.xml`,
        hint: composeHint('wikidot:site-changes'),
      },
      {
        uri: `${origin}/feed/forum/threads.xml`,
        hint: composeHint('wikidot:forum-threads'),
      },
    ]
  },
}
