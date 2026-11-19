import { paragraph } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ParagraphUrl = { kind: 'blog'; username: string }

const hosts = paragraph.hosts.exact

const userRegex = /^\/@([^/]+)/

const feeds = withHintLabels(paragraph.feeds)

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

    return [feeds.getFeedEntry('blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
