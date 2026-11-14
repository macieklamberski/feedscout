import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers gem, version (html).
// Handler needed for: home.

export type RubygemsUrl = { kind: 'gem'; gem: string } | { kind: 'home' }

const hosts = ['rubygems.org', 'www.rubygems.org']

const gemRegex = /^\/gems\/([\w.-]+)(?:\/|$)/i

// The index and bundler hosts serve the same feeds as rubygems.org.
const feeds = definePlatformFeeds([
  { key: 'rubygems:versions', template: 'https://rubygems.org/gems/{gem}/versions.atom' },
  {
    key: 'rubygems:versions',
    template: 'https://index.rubygems.org/gems/{gem}/versions.atom',
    isAlias: true,
  },
  {
    key: 'rubygems:versions',
    template: 'https://bundler.rubygems.org/gems/{gem}/versions.atom',
    isAlias: true,
  },
  { key: 'rubygems:latest-gems', template: 'https://rubygems.org/gems.atom' },
  { key: 'rubygems:latest-gems', template: 'https://index.rubygems.org/gems.atom', isAlias: true },
  {
    key: 'rubygems:latest-gems',
    template: 'https://bundler.rubygems.org/gems.atom',
    isAlias: true,
  },
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

    // Gem names are case-sensitive: /gems/RedCloth/versions.atom answers and /gems/redcloth 404s.
    if (parsed.kind === 'gem') {
      return [feeds.getFeedEntry('rubygems:versions', { gem: parsed.gem })]
    }

    // Every page links the FeedBurner mirror of this feed, which now serves the home page HTML.
    return [feeds.getFeedEntry('rubygems:latest-gems')]
  },

  getFeedHint: feeds.getFeedHint,
}
