import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export const isWikidotHtml = (content: string): boolean => {
  return content.includes('WIKIDOT.page.listeners.editClick()')
}

export const wikidotHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isWikidotHtml(content ?? '')
  },

  resolve: (url) => {
    try {
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
    } catch {}

    return []
  },
}
