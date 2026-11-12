import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers officialColumns, organization, profile, tag (guess, html).
// Handler needed for: popular.

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

// Qiita serves the user, tag and popular feeds at `/feed` too. The literal rows read before
// `/{username}/feed`, so a user named popular-items or official-columns reads as the site feed.
const feeds = definePlatformFeeds([
  { key: 'qiita:zine', template: 'https://qiita.com/official-columns/feed/', format: 'rss' },
  { key: 'qiita:zine', template: 'https://qiita.com/official-columns/feed/atom/', format: 'atom' },
  { key: 'qiita:popular', template: 'https://qiita.com/popular-items/feed.atom' },
  { key: 'qiita:popular', template: 'https://qiita.com/popular-items/feed' },
  {
    key: 'qiita:organization',
    template: 'https://qiita.com/organizations/{organization}/activities.atom',
  },
  { key: 'qiita:tag', template: 'https://qiita.com/tags/{tag}/feed.atom' },
  { key: 'qiita:tag', template: 'https://qiita.com/tags/{tag}/feed' },
  { key: 'qiita:posts', template: 'https://qiita.com/{username}/feed.atom' },
  { key: 'qiita:posts', template: 'https://qiita.com/{username}/feed' },
])

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

  if (!username) {
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
      return [feeds.getFeedEntry('qiita:tag', { tag: parsed.tag })]
    }

    if (parsed.kind === 'organization') {
      return [feeds.getFeedEntry('qiita:organization', { organization: parsed.organization })]
    }

    if (parsed.kind === 'popularItems') {
      return [feeds.getFeedEntry('qiita:popular')]
    }

    if (parsed.kind === 'officialColumns') {
      return [feeds.getFeedEntry('qiita:zine')]
    }

    return [feeds.getFeedEntry('qiita:posts', { username: parsed.username })]
  },

  // The table reads any first segment as a username, and a route word is none:
  // qiita.com/tags/feed is the page of the tag feed.
  getFeedKey: (url) => {
    const key = feeds.getFeedKey(url)

    if (key === 'qiita:posts' && parseQiitaUrl(url)?.kind !== 'user') {
      return
    }

    return key
  },
}
