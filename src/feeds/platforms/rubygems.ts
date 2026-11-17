import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: versions.
// Handler needed for: latest-gems.

export type RubygemsUrl = { kind: 'gem'; gem: string } | { kind: 'home' }

const hosts = ['rubygems.org', 'www.rubygems.org']

const gemRegex = /^\/gems\/([\w.-]+)(?:\/|$)/i

// The index and bundler hosts serve the same entries as rubygems.org, with links and ids on their
// own host.
const feeds = definePlatformFeeds([
  { key: 'rubygems:versions', main: 'https://rubygems.org/gems/{gem}/versions.atom' },
  { key: 'rubygems:versions', main: 'https://index.rubygems.org/gems/{gem}/versions.atom' },
  { key: 'rubygems:versions', main: 'https://bundler.rubygems.org/gems/{gem}/versions.atom' },
  { key: 'rubygems:latest-gems', main: 'https://rubygems.org/gems.atom' },
  { key: 'rubygems:latest-gems', main: 'https://index.rubygems.org/gems.atom' },
  { key: 'rubygems:latest-gems', main: 'https://bundler.rubygems.org/gems.atom' },
  // The dashboard feed of a signed-in user answers only with its `api_key`, so it is claimed and
  // never built.
  { key: 'rubygems:dashboard', main: 'https://rubygems.org/dashboard.atom?api_key={apiKey}' },
])

export const parseRubygemsUrl = (url: string): RubygemsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const gem = parsedUrl.pathname.match(gemRegex)?.[1]

  if (gem) {
    return { kind: 'gem', gem }
  }

  // Every other page, the home page included, links the latest gems feed.
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
        feeds.getFeedEntry('rubygems:versions', { gem: parsed.gem }),
        feeds.getFeedEntry('rubygems:latest-gems'),
      ]
    }

    // Every page links the FeedBurner mirror of this feed, which now serves the home page HTML.
    return [feeds.getFeedEntry('rubygems:latest-gems')]
  },

  getFeedHint: feeds.getFeedHint,
}
