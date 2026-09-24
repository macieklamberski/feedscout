import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domainSuffixRegex = /\.transistor\.fm$/i
// The show page links its feed, and the feed slug is not always the subdomain.
const feedSlugRegex = /https:\/\/feeds\.transistor\.fm\/([\w-]+)/

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

  resolve: (url, content) => {
    const { hostname } = new URL(url)
    const slug = content?.match(feedSlugRegex)?.[1] ?? hostname.replace(domainSuffixRegex, '')

    return [
      {
        uri: `https://feeds.transistor.fm/${slug}`,
        hint: composeHint('transistor:podcast'),
      },
    ]
  },
}
