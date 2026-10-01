import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type QiitaUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'organization'; organization: string }
  | { kind: 'popularItems' }
  | { kind: 'officialColumns' }
  | { kind: 'user'; username: string }

const hosts = ['qiita.com', 'www.qiita.com']

const tagRegex = /^\/tags\/([^/]+)/i
const organizationRegex = /^\/organizations\/([^/]+)/i
const popularItemsRegex = /^\/popular-items(\/|$)/i
const officialColumnsRegex = /^\/official-columns(\/|$)/i

const excludedPaths = [
  'about',
  'api',
  'login',
  'official-columns',
  'organizations',
  'popular-items',
  'privacy',
  'search',
  'settings',
  'signup',
  'tags',
  'terms',
  'trend',
]

export const parseQiitaUrl = (url: string): QiitaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const organization = pathname.match(organizationRegex)?.[1]

  if (organization) {
    return { kind: 'organization', organization }
  }

  if (popularItemsRegex.test(pathname)) {
    return { kind: 'popularItems' }
  }

  // Qiita Zine.
  if (officialColumnsRegex.test(pathname)) {
    return { kind: 'officialColumns' }
  }

  const [username] = getPathSegments(parsedUrl)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'user', username }
}

export const qiitaHandler: PlatformHandler = {
  match: (url) => {
    return parseQiitaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseQiitaUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [
        {
          uri: `https://qiita.com/tags/${parsed.tag}/feed.atom`,
          hint: composeHint('qiita:tag'),
        },
      ]
    }

    if (parsed.kind === 'organization') {
      return [
        {
          uri: `https://qiita.com/organizations/${parsed.organization}/activities.atom`,
          hint: composeHint('qiita:organization'),
        },
      ]
    }

    if (parsed.kind === 'popularItems') {
      return [
        {
          uri: 'https://qiita.com/popular-items/feed.atom',
          hint: composeHint('qiita:popular'),
        },
      ]
    }

    if (parsed.kind === 'officialColumns') {
      return [
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: composeHint('qiita:zine'),
        },
      ]
    }

    return [
      {
        uri: `https://qiita.com/${parsed.username}/feed.atom`,
        hint: composeHint('qiita:posts'),
      },
    ]
  },
}
