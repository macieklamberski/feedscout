import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type AmebloUrl = { kind: 'blog'; username: string }

const hosts = ['ameblo.jp', 'www.ameblo.jp']

// Ameba's fixed embed routes name the blog after the route, before the catch-all username.
const reblogCardRegex = /^\/s\/embed\/reblog-card\/([^/]+)\/entry-[^/]+\.html$/i
const imagePageRegex = /^\/p\/embed\/([^/]+)\/image-[^/]+\.html$/i

// A blog page links its feed on rssblog.ameba.jp, and ameblo.jp serves the same feeds under the
// same paths.
const feeds = definePlatformFeeds(
  [
    {
      key: 'ameblo:posts',
      template: 'https://rssblog.ameba.jp/{username}/rss20.xml',
      format: 'rss',
    },
    {
      key: 'ameblo:posts',
      template: '{scheme}://{host}/{username}/rss20.xml',
      format: 'rss',
      isAlias: true,
    },
    {
      key: 'ameblo:posts',
      template: 'https://rssblog.ameba.jp/{username}/atom.xml',
      format: 'atom',
    },
    {
      key: 'ameblo:posts',
      template: '{scheme}://{host}/{username}/atom.xml',
      format: 'atom',
      isAlias: true,
    },
    {
      key: 'ameblo:posts',
      template: 'https://rssblog.ameba.jp/{username}/rss.html',
      format: 'rdf',
    },
    {
      key: 'ameblo:posts',
      template: '{scheme}://{host}/{username}/rss.html',
      format: 'rdf',
      isAlias: true,
    },
  ],
  { hosts },
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

    if (!parsed) {
      return []
    }

    const params = { username: parsed.username }

    return [
      feeds.getFeedEntry('ameblo:posts', params, 'rss'),
      feeds.getFeedEntry('ameblo:posts', params, 'atom'),
      feeds.getFeedEntry('ameblo:posts', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
