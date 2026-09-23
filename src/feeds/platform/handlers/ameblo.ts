import { isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export const hosts = ['ameblo.jp', 'www.ameblo.jp']
export const excludedPaths = ['genre', 'hashtag', 'search']

export const amebloHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://ameblo.jp/${username}/rss20.xml`,
      hint: composeHint('ameblo:posts', 'rss'),
    })
    uris.push({
      uri: `https://ameblo.jp/${username}/atom.xml`,
      hint: composeHint('ameblo:posts', 'atom'),
    })
    uris.push({
      uri: `https://rssblog.ameba.jp/${username}/rss.html`,
      hint: composeHint('ameblo:posts', 'rdf'),
    })

    return uris
  },
}
