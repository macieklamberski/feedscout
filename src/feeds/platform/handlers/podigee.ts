import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Podigee shows live at `{slug}.podigee.io` with the canonical RSS feed at
// `/feed/mp3`, the only URL advertised in the show HTML via
// `<link rel="alternate" type="application/rss+xml">`. The handler emits
// that canonical feed and skips reserved subdomains (`www`, `app`, `help`,
// `blog`, etc.) that would otherwise produce 404-bound URIs on the
// corporate site.

const domainSuffixRegex = /\.podigee\.io$/i

// Reserved Podigee subdomains that aren't user shows. Without this guard the handler
// emits 404-bound URLs (e.g. https://www.podigee.io/feed/mp3 redirects to a 404 on
// podigee.com).
const reservedSlugs = new Set(['www', 'app', 'help', 'hilfe', 'blog', 'status', 'player', 'cdn'])

export const podigeeHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'podigee.io')) {
      return false
    }

    const slug = new URL(url).hostname.toLowerCase().replace(domainSuffixRegex, '')

    return !reservedSlugs.has(slug)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed/mp3`, hint: composeHint('podigee:podcast') }]
  },
}
