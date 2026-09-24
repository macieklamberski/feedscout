import { isAnyOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domainSuffixRegex = /\.podbean\.com$/i

// Reserved Podbean subdomains that aren't user shows. Without this guard, hitting
// podbean.com corporate/infra hosts produces feed.podbean.com/{reserved}/feed.xml
// URLs that resolve to real but unrelated user-owned shows (e.g. "The www's Podcast").
const reservedSlugs = ['www', 'feed', 'pbcdn1', 'sponsorship', 'podads', 'help', 'blog', 'support']

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'podbean.com')) {
      return false
    }

    const slug = new URL(url).hostname.replace(domainSuffixRegex, '')

    return !isAnyOf(slug, reservedSlugs)
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
