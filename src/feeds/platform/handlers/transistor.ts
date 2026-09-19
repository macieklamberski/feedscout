import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Transistor serves one canonical RSS feed per show off-domain at
// `feeds.transistor.fm/{slug}`, and show pages link to it via
// `<link rel="alternate">` so HTML autodiscovery technically works once
// the show URL is fetched. The handler maps `{slug}.transistor.fm` directly
// to the canonical feed without fetching, and skips reserved subdomains
// (`www`, `share`, `support`, …) that would otherwise resolve to 404s.

const domainSuffixRegex = /\.transistor\.fm$/i

// Reserved Transistor subdomains that aren't user shows. Without this guard the
// handler emits feeds.transistor.fm/{www|share|support|...} URLs that 404.
const reservedSlugs = new Set([
  'www',
  'feeds',
  'share',
  'support',
  'help',
  'developers',
  'api',
  'cdn',
])

export const transistorHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'transistor.fm')) {
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
        uri: `https://feeds.transistor.fm/${slug}`,
        hint: composeHint('transistor:podcast'),
      },
    ]
  },
}
