import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type AmebloUrl = { kind: 'blog'; username: string }

const hosts = ['ameblo.jp', 'www.ameblo.jp']
const feedHosts = ['ameblo.jp', 'rssblog.ameba.jp']

// Ameba's fixed embed routes name the blog after the route, before the catch-all username.
const reblogCardRegex = /^\/s\/embed\/reblog-card\/([^/]+)\/entry-[^/]+\.html$/i
const imagePageRegex = /^\/p\/embed\/([^/]+)\/image-[^/]+\.html$/i

// A blog page links its feed on rssblog.ameba.jp, and ameblo.jp serves the same feeds under the
// same paths, so the table reads both hosts.
const feeds = definePlatformFeeds(
  [
    { key: 'ameblo:posts', template: '{scheme}://{host}/{username}/rss20.xml', format: 'rss' },
    { key: 'ameblo:posts', template: '{scheme}://{host}/{username}/atom.xml', format: 'atom' },
    { key: 'ameblo:posts', template: '{scheme}://{host}/{username}/rss.html', format: 'rdf' },
  ],
  { hosts: feedHosts },
)

export const parseAmebloUrl = (url: string): AmebloUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  const embedUsername = pathname.match(reblogCardRegex)?.[1] ?? pathname.match(imagePageRegex)?.[1]

  if (embedUsername) {
    return { kind: 'blog', username: embedUsername }
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

    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const params = { host: 'rssblog.ameba.jp', username: parsed.username }

    return [
      page.getFeedEntry('ameblo:posts', params, 'rss'),
      page.getFeedEntry('ameblo:posts', params, 'atom'),
      page.getFeedEntry('ameblo:posts', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
