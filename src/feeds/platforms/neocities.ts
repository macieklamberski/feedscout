import { getPathSegments, getSubdomain, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type NeocitiesUrl = { kind: 'site'; username: string }

const domains = ['neocities.org']
const hosts = ['neocities.org', 'www.neocities.org']

export const parseNeocitiesUrl = (url: string): NeocitiesUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  if (subdomain) {
    return { kind: 'site', username: subdomain }
  }

  const [first, username] = getPathSegments(url)

  if (!isHostOf(url, hosts) || !isAnyOf(first, 'site') || !username) {
    return
  }

  return { kind: 'site', username }
}

export const neocitiesHandler: PlatformHandler = {
  match: (url) => {
    return parseNeocitiesUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNeocitiesUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://neocities.org/site/${parsed.username}.rss`,
        hint: composeHint('neocities:updates'),
      },
    ]
  },
}
