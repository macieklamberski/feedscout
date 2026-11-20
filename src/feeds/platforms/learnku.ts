import { learnku } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: site.
// Handler needed for: community.

export type LearnkuUrl = { kind: 'community'; community: string } | { kind: 'home' }

const feeds = withHintLabels(learnku.feeds)

export const parseLearnkuUrl = (url: string): LearnkuUrl | undefined => {
  const page = learnku.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'home') {
    return { kind: 'home' }
  }

  return { kind: 'community', community: page.params.community }
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
