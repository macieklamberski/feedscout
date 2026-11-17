import { csdn } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: blog.

export type CsdnUrl = { kind: 'blog'; username: string }

const hosts = csdn.hosts.exact

const userRegex = /^\/([^/]+)/

const feeds = withHintLabels(csdn.feeds)

export const parseCsdnUrl = (url: string): CsdnUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const username = new URL(url).pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const csdnHandler: PlatformHandler = {
  match: (url) => {
    return parseCsdnUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCsdnUrl(url)

    if (!parsed) {
      return []
    }

    const { username } = parsed

    return [feeds.getFeedEntry('blog', { username })]
  },

  getFeedHint: feeds.getFeedHint,
}
