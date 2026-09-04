import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Podbean shows live at `{slug}.podbean.com` with the canonical RSS feed at
// off-domain `feed.podbean.com/{slug}/feed.xml`; the slug-subdomain
// `/feed.xml` and `/feed/` paths 302-redirect there and the show HTML
// advertises the canonical feed via JSON-LD `webFeed`. The handler avoids
// the redirect hop by emitting the canonical form directly and guards
// against reserved subdomains (`www`, `support`, etc.) that would otherwise
// resolve to unrelated user-owned shows.

const domainSuffixRegex = /\.podbean\.com$/i

// Reserved Podbean subdomains that aren't user shows. Without this guard, hitting
// podbean.com corporate/infra hosts produces feed.podbean.com/{reserved}/feed.xml
// URLs that resolve to real but unrelated user-owned shows (e.g. "The www's Podcast").
const reservedSlugs = new Set([
  'www',
  'feed',
  'pbcdn1',
  'sponsorship',
  'podads',
  'help',
  'blog',
  'support',
])

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'podbean.com')) {
      return false
    }

    const slug = new URL(url).hostname.toLowerCase().replace(domainSuffixRegex, '')

    return !reservedSlugs.has(slug)
  },

  resolve: (url) => {
    const { hostname } = new URL(url)
    const slug = hostname.replace(domainSuffixRegex, '')

    return [
      {
        uri: `https://feed.podbean.com/${slug}/feed.xml`,
        hint: composeHint('podbean:podcast'),
      },
    ]
  },
}
