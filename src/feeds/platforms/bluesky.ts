import { bluesky } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BlueskyUrl = { kind: 'profile'; handle: string }

const hosts = bluesky.hosts.exact

const feeds = withHintLabels(bluesky.feeds)

export const parseBlueskyUrl = (url: string): BlueskyUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, handle] = getPathSegments(url)

  if (!isAnyOf(section, 'profile') || !handle) {
    return
  }

  return { kind: 'profile', handle }
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return parseBlueskyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlueskyUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('posts', { handle: parsed.handle })]
  },

  getFeedHint: feeds.getFeedHint,
}
