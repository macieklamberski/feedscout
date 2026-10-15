import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

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

const excludedHosts = [
  'ad.seesaa.net',
  'mx.seesaa.net',
  's.seesaa.blog',
  's.seesaa.net',
  's.seesaa.space',
  't.seesaa.blog',
  'up.seesaa.net',
]

export const parseSeesaaUrl = (url: string): SeesaaUrl | undefined => {
  if (!getTenantSubdomain(url, domains) || isHostOf(url, excludedHosts)) {
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

    uris.push({ uri: `${origin}/index20.rdf`, hint: composeHint('seesaa:posts', 'rss') })
    uris.push({ uri: `${origin}/index.rdf`, hint: composeHint('seesaa:posts', 'rdf') })

    return uris
  },
}
