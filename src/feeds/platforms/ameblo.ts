import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type AmebloUrl = { kind: 'blog'; username: string }

const hosts = ['ameblo.jp', 'www.ameblo.jp']
const feedHosts = ['ameblo.jp', 'rssblog.ameba.jp']

// A blog page links its feed on rssblog.ameba.jp, and ameblo.jp serves the same feeds under the
// same paths, so the table reads both hosts.
const feeds = definePlatformFeeds(
  [
    { key: 'ameblo:posts', template: 'https://{host}/{username}/rss20.xml', format: 'rss' },
    { key: 'ameblo:posts', template: 'https://{host}/{username}/atom.xml', format: 'atom' },
    { key: 'ameblo:posts', template: 'https://{host}/{username}/rss.html', format: 'rdf' },
  ],
  { hosts: feedHosts },
)

export const parseAmebloUrl = (url: string): AmebloUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const amebloHandler: PlatformHandler = {
  match: (url) => {
    return parseAmebloUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAmebloUrl(url)

    if (!parsed) {
      return []
    }

    const params = { host: 'rssblog.ameba.jp', username: parsed.username }

    return [
      feeds.getFeedEntry('ameblo:posts', params, 'rss'),
      feeds.getFeedEntry('ameblo:posts', params, 'atom'),
      feeds.getFeedEntry('ameblo:posts', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
