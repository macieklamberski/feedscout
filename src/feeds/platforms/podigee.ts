import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['podigee.io']

// Reserved Podigee subdomains that aren't user shows. Without this guard the handler
// emits 404-bound URLs (e.g. https://www.podigee.io/feed/mp3 redirects to a 404 on
// podigee.com).
const reservedSlugs = ['www', 'app', 'help', 'hilfe', 'blog', 'status', 'player', 'cdn']

export const podigeeHandler: PlatformHandler = {
  match: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return false
    }

    return !isAnyOf(slug, reservedSlugs)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed/mp3`, hint: composeHint('podigee:podcast') }]
  },
}
