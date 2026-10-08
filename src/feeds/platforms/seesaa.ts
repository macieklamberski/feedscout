import { isHostOrSubdomainOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, iiblog, seesaaSpace, sokuho, xblog (html), partly covers stablo.
// Handler needed for: seesaaBlog.

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

// Service hosts off the blog farm, with every host under them: the image host each blog page
// links, the ad network, mail and staging behind basic auth. www.seesaa.net is on the farm but
// redirects every path to the blog.seesaa.jp portal.
const excludedDomains = [
  'ad.seesaa.net',
  'mx.seesaa.net',
  's.seesaa.blog',
  's.seesaa.net',
  's.seesaa.space',
  't.seesaa.blog',
  'up.seesaa.net',
  'www.seesaa.net',
]

export const parseSeesaaUrl = (url: string): SeesaaUrl | undefined => {
  if (!isSubdomainOf(url, domains) || isHostOrSubdomainOf(url, excludedDomains)) {
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
