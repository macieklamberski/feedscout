import { hearthis } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HearthisUrl = { kind: 'profile'; username: string }

const hosts = hearthis.hosts.exact

const feeds = withHintLabels(hearthis.feeds)

export const parseHearthisUrl = (url: string): HearthisUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const hearthisHandler: PlatformHandler = {
  match: (url) => {
    return parseHearthisUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHearthisUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('tracks', { username: parsed.username }),
      feeds.getFeedEntry('track-list', { username: parsed.username }),
      feeds.getFeedEntry('new-tracks'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
