import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ZennUrl =
  | { kind: 'user'; username: string }
  | { kind: 'post'; username: string }
  | { kind: 'topic'; topic: string }
  | { kind: 'publication'; publication: string }
  | { kind: 'home' }

export const hosts = ['zenn.dev', 'www.zenn.dev']

const topicRegex = /^\/topics\/([^/]+)/i
const publicationRegex = /^\/p\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'zenn:topic', template: 'https://zenn.dev/topics/{topic}/feed' },
  { key: 'zenn:publication', template: 'https://zenn.dev/p/{publication}/feed' },
  { key: 'zenn:posts', template: 'https://zenn.dev/{username}/feed' },
  { key: 'zenn:trending', template: 'https://zenn.dev/feed' },
])

export const parseZennUrl = (url: string): ZennUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const topic = pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', topic }
  }

  const publication = pathname.match(publicationRegex)?.[1]

  if (publication) {
    return { kind: 'publication', publication }
  }

  const [username, section] = getPathSegments(parsedUrl)

  if (!username) {
    return { kind: 'home' }
  }

  if (section) {
    return { kind: 'post', username }
  }

  return { kind: 'user', username }
}

export const zennHandler: PlatformHandler = {
  match: (url) => {
    return parseZennUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseZennUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'topic') {
      return [feeds.getFeedEntry('zenn:topic', { topic: parsed.topic })]
    }

    if (parsed.kind === 'publication') {
      return [feeds.getFeedEntry('zenn:publication', { publication: parsed.publication })]
    }

    if (parsed.kind === 'user' || parsed.kind === 'post') {
      return [feeds.getFeedEntry('zenn:posts', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('zenn:trending')]
  },

  // The posts row reads any first segment as a name, so zenn.dev/topics/feed, the page of a topic
  // named feed, is refused when the page parser reads it as a topic or publication.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key === 'zenn:posts' && parseZennUrl(url)?.kind !== 'post') {
      return
    }

    return hint
  },
}
