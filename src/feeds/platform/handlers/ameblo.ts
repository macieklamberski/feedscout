import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Ameba blogs expose three per-user feeds: RSS 2.0 at
// `ameblo.jp/{user}/rss20.xml`, Atom at `ameblo.jp/{user}/atom.xml`, and RSS
// 1.0 (RDF) at `rssblog.ameba.jp/{user}/rss.html`. HTML autodiscovery on the
// user page advertises only the mirror `rssblog.ameba.jp/{user}/rss20.xml`,
// which serves byte-identical content to the ameblo.jp form.
// The handler emits all three formats and prefers the canonical `ameblo.jp`
// host over the autodiscovered `rssblog.ameba.jp` mirror.

const hosts = ['ameblo.jp', 'www.ameblo.jp']
const excludedPaths = ['genre', 'hashtag', 'search']

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
      hint: composeHint('ameblo:posts-rss'),
    })
    uris.push({
      uri: `https://ameblo.jp/${username}/atom.xml`,
      hint: composeHint('ameblo:posts-atom'),
    })
    uris.push({
      uri: `https://rssblog.ameba.jp/${username}/rss.html`,
      hint: composeHint('ameblo:posts-rdf'),
    })

    return uris
  },
}
