import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers gem, version (html).
// Handler needed for: home.

const hosts = ['rubygems.org', 'www.rubygems.org']

const gemRegex = /^\/gems\/([\w.-]+)(?:\/|$)/i

export const rubygemsHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const gem = pathname.match(gemRegex)?.[1]

    // Gem names are case-sensitive: /gems/RedCloth/versions.atom answers and /gems/redcloth 404s.
    if (gem) {
      return [
        {
          uri: `https://rubygems.org/gems/${gem}/versions.atom`,
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
