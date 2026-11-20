import { heyWorld } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HeyWorldUrl = { kind: 'blog'; username: string }

const hosts = heyWorld.hosts.exact

const feeds = withHintLabels(heyWorld.feeds)

export const parseHeyWorldUrl = (url: string): HeyWorldUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const heyWorldHandler: PlatformHandler = {
  match: (url) => {
    return parseHeyWorldUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHeyWorldUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
