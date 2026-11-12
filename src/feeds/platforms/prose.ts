import { getQueryParam, getSubdomain, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ProseUrl =
  | { kind: 'home' }
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'blog'; username: string }

const domains = ['prose.sh']
const apexHosts = ['prose.sh']

const feeds = definePlatformFeeds(
  [
    { key: 'prose:discovery', template: 'https://prose.sh/rss' },
    { key: 'prose:discovery', template: 'https://prose.sh/rss.atom' },
    { key: 'prose:tag', template: 'https://{username}.prose.sh/rss?tag={tag}' },
    { key: 'prose:tag', template: 'https://{username}.prose.sh/atom?tag={tag}' },
    { key: 'prose:tag', template: 'https://{username}.prose.sh/rss.xml?tag={tag}' },
    { key: 'prose:tag', template: 'https://{username}.prose.sh/feed.xml?tag={tag}' },
    { key: 'prose:tag', template: 'https://{username}.prose.sh/atom.xml?tag={tag}' },
    { key: 'prose:blog', template: 'https://{username}.prose.sh/rss' },
    { key: 'prose:blog', template: 'https://{username}.prose.sh/atom' },
    { key: 'prose:blog', template: 'https://{username}.prose.sh/rss.xml' },
    { key: 'prose:blog', template: 'https://{username}.prose.sh/feed.xml' },
    { key: 'prose:blog', template: 'https://{username}.prose.sh/atom.xml' },
  ],
  { isWwwTenant: true },
)

export const parseProseUrl = (url: string): ProseUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // Apex prose.sh is the platform-wide discovery firehose, not a per-blog feed.
  if (isHostOf(parsedUrl, apexHosts)) {
    return { kind: 'home' }
  }

  // `www` is a Prose user like any other, so `www.prose.sh` is a blog.
  const username = getSubdomain(parsedUrl, domains)

  if (!username || username.includes('.')) {
    return
  }

  const tag = getQueryParam(parsedUrl.searchParams, 'tag')

  if (tag) {
    return { kind: 'tag', username, tag }
  }

  return { kind: 'blog', username }
}

export const proseHandler: PlatformHandler = {
  match: (url) => {
    return parseProseUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseProseUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('prose:discovery')]
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('prose:tag', { username: parsed.username, tag: parsed.tag })]
    }

    return [feeds.getFeedEntry('prose:blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
