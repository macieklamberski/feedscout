import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers gem, version (html).
// Handler needed for: home.

export type RubygemsUrl = { kind: 'gem'; gem: string } | { kind: 'home' }

const hosts = ['rubygems.org', 'www.rubygems.org']

const gemRegex = /^\/gems\/([\w.-]+)(?:\/|$)/i

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
      return [
        {
          uri: `https://rubygems.org/gems/${parsed.gem}/versions.atom`,
          hint: composeHint('rubygems:versions'),
        },
      ]
    }

    // Every page links the FeedBurner mirror of this feed, which now serves the home page HTML.
    return [
      {
        uri: 'https://rubygems.org/gems.atom',
        hint: composeHint('rubygems:latest-gems'),
      },
    ]
  },
}
