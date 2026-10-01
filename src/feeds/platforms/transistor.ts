import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TransistorUrl = { kind: 'show'; slug: string }

const domains = ['transistor.fm']

// The show page links its feed, and the feed slug is not always the subdomain.
const feedSlugRegex = /https:\/\/feeds\.transistor\.fm\/([\w-]+)/

// Reserved Transistor subdomains that aren't user shows. Without this guard the
// handler emits feeds.transistor.fm/{www|share|support|...} URLs that 404.
const excludedSubdomains = ['www', 'feeds', 'share', 'support', 'help', 'developers', 'api', 'cdn']

export const parseTransistorUrl = (url: string): TransistorUrl | undefined => {
  const slug = getSubdomain(url, domains)

  if (!slug || isAnyOf(slug, excludedSubdomains)) {
    return
  }

  return { kind: 'show', slug }
}

export const transistorHandler: PlatformHandler = {
  match: (url) => {
    return parseTransistorUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseTransistorUrl(url)

    if (!parsed) {
      return []
    }

    const slug = content?.match(feedSlugRegex)?.[1] ?? parsed.slug

    return [
      {
        uri: `https://feeds.transistor.fm/${slug}`,
        hint: composeHint('transistor:podcast'),
      },
    ]
  },
}
