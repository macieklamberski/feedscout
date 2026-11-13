import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, tag.

export type PikaUrl = { kind: 'tag'; blog: string; tag: string } | { kind: 'blog'; blog: string }

const domains = ['pika.page']

const tagRegex = /^\/tag\/([^/]+)/i

const feeds = definePlatformFeeds(
  [
    { key: 'pika:posts', template: '{scheme}://{host}/posts_feed', format: 'atom' },
    { key: 'pika:posts', template: '{scheme}://{host}/posts_feed.rss', format: 'rss' },
    { key: 'pika:posts', template: '{scheme}://{host}/posts_feed.atom', format: 'atom' },
    { key: 'pika:posts', template: '{scheme}://{host}/feed', format: 'atom' },
    { key: 'pika:tag', template: '{scheme}://{host}/tag/{tag}/feed', format: 'atom' },
    { key: 'pika:tag', template: '{scheme}://{host}/tag/{tag}/feed.rss', format: 'rss' },
    { key: 'pika:tag', template: '{scheme}://{host}/tag/{tag}/feed.atom', format: 'atom' },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('pika:tag', { tag: parsed.tag }, 'atom'),
        page.getFeedEntry('pika:tag', { tag: parsed.tag }, 'rss'),
        page.getFeedEntry('pika:posts', {}, 'atom'),
        page.getFeedEntry('pika:posts', {}, 'rss'),
      ]
    }

    return [page.getFeedEntry('pika:posts', {}, 'atom'), page.getFeedEntry('pika:posts', {}, 'rss')]
  },

  getFeedHint: feeds.getFeedHint,
}
