import { ameblo } from 'feedintel'
import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: posts.

export type AmebloUrl = { kind: 'blog'; username: string }

const hosts = ameblo.hosts.exact

// Ameba's fixed embed routes name the blog after the route, before the catch-all username.
const reblogCardRegex = /^\/s\/embed\/reblog-card\/([^/]+)\/entry-[^/]+\.html$/i
const imagePageRegex = /^\/p\/embed\/([^/]+)\/image-[^/]+\.html$/i

const feeds = withHintLabels(ameblo.feeds)

export const parseAmebloUrl = (url: string): AmebloUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
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
      feeds.getFeedEntry('posts', params, 'rss'),
      feeds.getFeedEntry('posts', params, 'atom'),
      feeds.getFeedEntry('posts', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
