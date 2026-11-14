import { decodeSegment, getPathSegments } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggerDeUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'topic'; blog: string; topic: string }

const domains = ['blogger.de']

// `/topics/{topic}/rss` serves the posts feed unfiltered, while `/rss?topic={topic}` narrows it to
// the topic. `/rss?show=all` adds the comments to the posts.
const feeds = definePlatformFeeds(
  [
    { key: 'blogger-de:posts', template: '{scheme}://{host}/rss' },
    { key: 'blogger-de:posts', template: '{scheme}://{host}/topics/{topic}/rss' },
    { key: 'blogger-de:posts-comments', template: '{scheme}://{host}/rss?show=all' },
    { key: 'blogger-de:topic', template: '{scheme}://{host}/rss?topic={topic}' },
  ],
  { domains },
)

export const parseBloggerDeUrl = (url: string): BloggerDeUrl | undefined => {
  // A nested subdomain like a.b.blogger.de fails TLS, since the certificate covers one label.
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  // A topic path writes a space as `+`, as `/topics/Best+of+2006/`.
  const [route, segment] = getPathSegments(url)
  const topic = route === 'topics' ? decodeSegment(segment?.replaceAll('+', ' ')) : undefined

  if (topic) {
    return { kind: 'topic', blog, topic }
  }

  return { kind: 'blog', blog }
}

export const bloggerDeHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggerDeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBloggerDeUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'topic') {
      return [
        page.getFeedEntry('blogger-de:topic', { topic: parsed.topic }),
        page.getFeedEntry('blogger-de:posts'),
        page.getFeedEntry('blogger-de:posts-comments'),
      ]
    }

    return [page.getFeedEntry('blogger-de:posts'), page.getFeedEntry('blogger-de:posts-comments')]
  },

  getFeedHint: feeds.getFeedHint,
}
