import { zenn } from 'feedintel'
import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts, publication, topic, trending.
// Handler needed for: all-posts.

export type ZennUrl =
  | { kind: 'user'; username: string }
  | { kind: 'post'; username: string }
  | { kind: 'topic'; topic: string }
  | { kind: 'publication'; publication: string }
  | { kind: 'home' }

export const hosts = zenn.hosts.exact

const topicRegex = /^\/topics\/([^/]+)/i
const publicationRegex = /^\/p\/([^/]+)/i

const feeds = withHintLabels(zenn.feeds)

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

    // The trending feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'topic') {
      return [feeds.getFeedEntry('topic', { topic: parsed.topic }), feeds.getFeedEntry('trending')]
    }

    if (parsed.kind === 'publication') {
      return [
        feeds.getFeedEntry('publication', { publication: parsed.publication }),
        feeds.getFeedEntry('trending'),
      ]
    }

    if (parsed.kind === 'user' || parsed.kind === 'post') {
      return [
        feeds.getFeedEntry('posts', { username: parsed.username }),
        feeds.getFeedEntry('all-posts', { username: parsed.username }),
        feeds.getFeedEntry('trending'),
      ]
    }

    return [feeds.getFeedEntry('trending')]
  },

  getFeedHint: feeds.getFeedHint,
}
