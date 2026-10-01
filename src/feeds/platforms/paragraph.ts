import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ParagraphUrl = { kind: 'blog'; username: string }

const hosts = ['paragraph.com', 'www.paragraph.com']
const userRegex = /^\/@([^/]+)/

export const parseParagraphUrl = (url: string): ParagraphUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const paragraphHandler: PlatformHandler = {
  match: (url) => {
    return parseParagraphUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseParagraphUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://api.paragraph.com/blogs/rss/@${parsed.username}`,
        hint: composeHint('paragraph:blog'),
      },
    ]
  },
}
