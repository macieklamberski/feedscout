import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type AmebloUrl = { kind: 'blog'; username: string }

const hosts = ['ameblo.jp', 'www.ameblo.jp']
const excludedPaths = ['genre', 'hashtag', 'search']

export const parseAmebloUrl = (url: string): AmebloUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'blog', username }
}

export const amebloHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const username = parseAmebloUrl(url)?.username

    if (!username) {
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
