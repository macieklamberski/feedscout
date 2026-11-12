import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, tag.

export type PikaUrl = { kind: 'tag'; blog: string; tag: string } | { kind: 'blog'; blog: string }

const domains = ['pika.page']

const tagRegex = /^\/tag\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'pika:posts', template: 'https://{blog}.pika.page/posts_feed', format: 'atom' },
  { key: 'pika:posts', template: 'https://{blog}.pika.page/posts_feed.rss', format: 'rss' },
  { key: 'pika:tag', template: 'https://{blog}.pika.page/tag/{tag}/feed', format: 'atom' },
  { key: 'pika:tag', template: 'https://{blog}.pika.page/tag/{tag}/feed.rss', format: 'rss' },
])

export const parsePikaUrl = (url: string): PikaUrl | undefined => {
  const parsedUrl = parseUrl(url)
  const blog = parsedUrl ? getTenantSubdomain(parsedUrl, domains) : undefined

  if (!parsedUrl || !blog) {
    return
  }

  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', blog, tag }
  }

  return { kind: 'blog', blog }
}

export const pikaHandler: PlatformHandler = {
  match: (url) => {
    return parsePikaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePikaUrl(url)

    if (!parsed) {
      return []
    }

    const { blog } = parsed
    const posts = [
      feeds.getFeedEntry('pika:posts', { blog }, 'atom'),
      feeds.getFeedEntry('pika:posts', { blog }, 'rss'),
    ]

    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('pika:tag', { blog, tag: parsed.tag }, 'atom'),
        feeds.getFeedEntry('pika:tag', { blog, tag: parsed.tag }, 'rss'),
        ...posts,
      ]
    }

    return posts
  },

  getFeedKey: feeds.getFeedKey,
}
