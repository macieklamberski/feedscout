import { getSubdomain } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['fireside.fm']

// Fireside's own services, not shows.
const excludedSubdomains = ['app', 'assets', 'blog', 'feeds', 'help', 'media', 'status', 'www']

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    const slug = getSubdomain(url, domains)

    return slug !== undefined && !excludedSubdomains.includes(slug)
  },

  resolve: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://feeds.fireside.fm/${slug}/rss`,
      hint: composeHint('fireside:podcast', 'rss'),
    })
    uris.push({
      uri: `https://${slug}.fireside.fm/json`,
      hint: composeHint('fireside:podcast', 'json'),
    })

    return uris
  },
}
