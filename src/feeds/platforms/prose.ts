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
    { key: 'prose:discovery', template: 'https://prose.sh/rss.atom', isAlias: true },
    { key: 'prose:tag', template: '{scheme}://{host}/rss?tag={tag}' },
    { key: 'prose:tag', template: '{scheme}://{host}/atom?tag={tag}', isAlias: true },
    { key: 'prose:tag', template: '{scheme}://{host}/rss.xml?tag={tag}', isAlias: true },
    { key: 'prose:tag', template: '{scheme}://{host}/feed.xml?tag={tag}', isAlias: true },
    { key: 'prose:tag', template: '{scheme}://{host}/atom.xml?tag={tag}', isAlias: true },
    { key: 'prose:blog', template: '{scheme}://{host}/rss' },
    { key: 'prose:blog', template: '{scheme}://{host}/atom', isAlias: true },
    { key: 'prose:blog', template: '{scheme}://{host}/rss.xml', isAlias: true },
    { key: 'prose:blog', template: '{scheme}://{host}/feed.xml', isAlias: true },
    { key: 'prose:blog', template: '{scheme}://{host}/atom.xml', isAlias: true },
  ],
  { domains, isWwwTenant: true },
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

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('prose:tag', { tag: parsed.tag })]
    }

    return [page.getFeedEntry('prose:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
