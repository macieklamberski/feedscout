import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OverblogUrl = { kind: 'blog' }

const domains = [
  'over-blog.com',
  'over-blog.de',
  'over-blog.es',
  'over-blog.fr',
  'over-blog.it',
  'over-blog.net',
  'over-blog.org',
  'over.blog',
  'overblog.com',
  'overblog.fr',
]

export const parseOverblogUrl = (url: string): OverblogUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const overblogHandler: PlatformHandler = {
  match: (url) => {
    return parseOverblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOverblogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/rss`, hint: composeHint('overblog:posts') })

    return uris
  },
}
