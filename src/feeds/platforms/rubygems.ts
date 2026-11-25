import { rubygems } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: versions.
// Handler needed for: latest-gems.

export type RubygemsUrl = { kind: 'gem'; gem: string } | { kind: 'home' }

const feeds = withHintLabels(rubygems.feeds)

export const parseRubygemsUrl = (url: string): RubygemsUrl | undefined => {
  const page = rubygems.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'gem') {
    return { kind: 'gem', gem: page.values.gem }
  }

  return { kind: 'home' }
}

export const rubygemsHandler: PlatformHandler = {
  match: (url) => {
    return parseRubygemsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRubygemsUrl(url)

    if (!parsed) {
      return []
    }

    // The latest gems feed needs no value from the page, so every page builds it after its own
    // feeds. Gem names are case-sensitive: /gems/RedCloth/versions.atom answers and /gems/redcloth
    // 404s.
    if (parsed.kind === 'gem') {
      return [
        feeds.getFeedEntry('versions', { gem: parsed.gem }),
        feeds.getFeedEntry('latest-gems'),
      ]
    }

    // Every page links the FeedBurner mirror of this feed, which now serves the home page HTML.
    return [feeds.getFeedEntry('latest-gems')]
  },

  getFeedHint: feeds.getFeedHint,
}
