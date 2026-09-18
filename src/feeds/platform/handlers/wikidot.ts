import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// A Wikidot page's only `alternate` link is an `application/wiki` edit link, so
// discovery finds no feed. Site and forum feeds live at `/feed/site-changes.xml`
// and `/feed/forum/threads.xml`.
//
// The match is on content, never on hostname: Wikidot serves custom domains
// such as scpwiki.com that a `*.wikidot.com` host check would miss.

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
