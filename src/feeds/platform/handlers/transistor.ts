import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Not discoverable without handler.

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
