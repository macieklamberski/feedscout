import { getPathSegments, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers other (guess, html), partly covers community.

export type LearnkuUrl = { kind: 'community'; community: string } | { kind: 'home' }

const hosts = ['learnku.com', 'www.learnku.com']

const feeds = definePlatformFeeds([
  { key: 'learnku:site', template: 'https://learnku.com/feed' },
  { key: 'learnku:community', template: 'https://learnku.com/{community}/feed' },
])

export const parseLearnkuUrl = (url: string): LearnkuUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [community] = getPathSegments(url)

  if (!community) {
    return { kind: 'home' }
  }

  return { kind: 'community', community }
}

export const learnkuHandler: PlatformHandler = {
  match: (url) => {
    return parseLearnkuUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLearnkuUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'community') {
      uris.push(feeds.getFeedEntry('learnku:community', { community: parsed.community }))
    }

    uris.push(feeds.getFeedEntry('learnku:site'))

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
