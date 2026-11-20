import { buzzsprout } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BuzzsproutUrl = { kind: 'podcast'; podcastId: string }

const hosts = buzzsprout.hosts.exact

const feeds = withHintLabels(buzzsprout.feeds)

export const parseBuzzsproutUrl = (url: string): BuzzsproutUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [podcastId] = getPathSegments(url)

  if (!podcastId || !digitsRegex.test(podcastId)) {
    return
  }

  return { kind: 'podcast', podcastId }
}

export const buzzsproutHandler: PlatformHandler = {
  match: (url) => {
    return parseBuzzsproutUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBuzzsproutUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { podcastId: parsed.podcastId })]
  },

  getFeedHint: feeds.getFeedHint,
}
