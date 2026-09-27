import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['transistor.fm']

// The show page links its feed, and the feed slug is not always the subdomain.
const feedSlugRegex = /https:\/\/feeds\.transistor\.fm\/([\w-]+)/

// Reserved Transistor subdomains that aren't user shows. Without this guard the
// handler emits feeds.transistor.fm/{www|share|support|...} URLs that 404.
const reservedSlugs = ['www', 'feeds', 'share', 'support', 'help', 'developers', 'api', 'cdn']

export const transistorHandler: PlatformHandler = {
  match: (url) => {
    const slug = getSubdomain(url, domains)

    if (!slug) {
      return false
    }

    return !isAnyOf(slug, reservedSlugs)
  },

  resolve: (url, content) => {
    const slug = content?.match(feedSlugRegex)?.[1] ?? getSubdomain(url, domains)

    if (!slug) {
      return []
    }

    return [
      {
        uri: `https://feeds.transistor.fm/${slug}`,
        hint: composeHint('transistor:podcast'),
      },
    ]
  },
}
