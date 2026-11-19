import { listed } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ListedUrl = { kind: 'blog'; username: string }

const hosts = listed.hosts.exact

const userRegex = /^\/@([^/]+)/

const feeds = withHintLabels(listed.feeds)

export const parseListedUrl = (url: string): ListedUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const username = new URL(url).pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const listedHandler: PlatformHandler = {
  match: (url) => {
    return parseListedUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseListedUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
