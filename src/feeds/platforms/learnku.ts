import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: site.
// Handler needed for: community.

export type LearnkuUrl = { kind: 'community'; community: string } | { kind: 'home' }

const hosts = ['learnku.com', 'www.learnku.com']

const feeds = definePlatformFeeds('learnku', [
  { key: 'site', main: 'https://learnku.com/feed' },
  { key: 'community', main: 'https://learnku.com/{community}/feed' },
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

    if (parsed.kind === 'community') {
      return [
        feeds.getFeedEntry('community', { community: parsed.community }),
        feeds.getFeedEntry('site'),
      ]
    }

    return [feeds.getFeedEntry('site')]
  },

  getFeedHint: feeds.getFeedHint,
}
