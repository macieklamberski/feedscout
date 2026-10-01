import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BuzzsproutUrl = { kind: 'podcast'; podcastId: string }

const hosts = ['buzzsprout.com', 'www.buzzsprout.com']
const numericRegex = /^\d+$/

export const parseBuzzsproutUrl = (url: string): BuzzsproutUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [podcastId] = getPathSegments(url)

  if (!podcastId || !numericRegex.test(podcastId)) {
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

    return [
      {
        uri: `https://rss.buzzsprout.com/${parsed.podcastId}.rss`,
        hint: composeHint('buzzsprout:podcast'),
      },
    ]
  },
}
