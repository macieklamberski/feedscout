import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, iiblog, seesaaBlog, seesaaSpace, sokuho, xblog (html), partly covers stablo.

export type SeesaaUrl = { kind: 'blog' }

const domains = [
  'seesaa.net',
  'iiblog.jp',
  'seesaa.blog',
  'seesaa.space',
  'sokuho.org',
  'stablo.jp',
  'xblog.jp',
]

export const parseSeesaaUrl = (url: string): SeesaaUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const seesaaHandler: PlatformHandler = {
  match: (url) => {
    return parseSeesaaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSeesaaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/index20.rdf`, hint: composeHint('seesaa:posts-rss2') })
    uris.push({ uri: `${origin}/index.rdf`, hint: composeHint('seesaa:posts', 'rdf') })

    return uris
  },
}
