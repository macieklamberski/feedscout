import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TransistorUrl = { kind: 'show'; slug: string }

const domains = ['transistor.fm']
// The feed host serves every show by path, so it names no show.
const feedHosts = ['feeds.transistor.fm']

// The show page links its feed, and the feed slug is not always the subdomain.
const feedSlugRegex = /https:\/\/feeds\.transistor\.fm\/([\w-]+)/

export const parseTransistorUrl = (url: string): TransistorUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

  if (!slug || isHostOf(url, feedHosts)) {
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
