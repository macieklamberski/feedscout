import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.
//
// {slug}.podbean.com/feed.xml also works but 302-redirects to feed.podbean.com.

const domainSuffix = /\.podbean\.com$/i

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

    const slug = new URL(url).hostname.toLowerCase().replace(domainSuffix, '')

    return !reservedSlugs.has(slug)
  },

  resolve: (url) => {
    const { hostname } = new URL(url)
    const slug = hostname.replace(domainSuffix, '')

    return [
      {
        uri: `https://feed.podbean.com/${slug}/feed.xml`,
        hint: composeHint('podbean:podcast'),
      },
    ]
  },
}
