import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ZennUrl =
  | { kind: 'user'; username: string }
  | { kind: 'topic'; topic: string }
  | { kind: 'publication'; publication: string }

export const hosts = ['zenn.dev', 'www.zenn.dev']

const topicRegex = /^\/topics\/([^/]+)/
const publicationRegex = /^\/(?:p|publications)\/([^/]+)/

const excludedPaths = [
  'about',
  'api',
  'articles',
  'books',
  'login',
  'notifications',
  'p',
  'privacy',
  'publications',
  'scraps',
  'search',
  'settings',
  'signup',
  'terms',
  'topics',
]

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

  const [username] = getPathSegments(parsedUrl)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'user', username }
}

export const zennHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const parsed = parseZennUrl(url)

    if (parsed?.kind === 'topic') {
      return [
        {
          uri: `https://zenn.dev/topics/${parsed.topic}/feed`,
          hint: composeHint('zenn:topic'),
        },
      ]
    }

    if (parsed?.kind === 'publication') {
      return [
        {
          uri: `https://zenn.dev/p/${parsed.publication}/feed`,
          hint: composeHint('zenn:publication'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://zenn.dev/${parsed.username}/feed`,
          hint: composeHint('zenn:posts'),
        },
      ]
    }

    // Homepage: trending feed.
    if (getPathSegments(url).length === 0) {
      return [
        {
          uri: 'https://zenn.dev/feed',
          hint: composeHint('zenn:trending'),
        },
      ]
    }

    return []
  },
}
