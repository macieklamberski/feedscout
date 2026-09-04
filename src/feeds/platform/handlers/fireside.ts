import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Fireside.fm show pages advertise both the canonical RSS at
// `feeds.fireside.fm/{slug}/rss` and the JSON Feed at
// `{slug}.fireside.fm/json` via HTML `<link rel="alternate">`, so generic
// discovery can find them on the Fireside-hosted subdomain. The handler
// is needed to emit both feed URIs deterministically from the
// `{slug}.fireside.fm` hostname without parsing the page.

const domainSuffixRegex = /\.fireside\.fm$/i

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'fireside.fm')
  },

  resolve: (url) => {
    const { hostname } = new URL(url)
    const slug = hostname.replace(domainSuffixRegex, '')
    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://feeds.fireside.fm/${slug}/rss`,
      hint: composeHint('fireside:podcast-rss'),
    })
    uris.push({
      uri: `https://${slug}.fireside.fm/json`,
      hint: composeHint('fireside:podcast-json'),
    })

    return uris
  },
}
