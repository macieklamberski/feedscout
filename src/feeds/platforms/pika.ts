import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts, tag.
// Handler adds formats for: posts (rss), tag (rss).

export type PikaUrl = { kind: 'tag'; tag: string } | { kind: 'blog' }

const domains = ['pika.page']

const tagRegex = /^\/tag\/([^/]+)/i

const feeds = definePlatformFeeds(
  'pika',
  [
    {
      key: 'posts',
      main: '{scheme}://{host}/posts_feed',
      format: 'atom',
      aliases: ['{scheme}://{host}/posts_feed.atom', '{scheme}://{host}/feed'],
    },
    { key: 'posts', main: '{scheme}://{host}/posts_feed.rss', format: 'rss' },
    {
      key: 'tag',
      main: '{scheme}://{host}/tag/{tag}/feed',
      format: 'atom',
      aliases: ['{scheme}://{host}/tag/{tag}/feed.atom'],
    },
    { key: 'tag', main: '{scheme}://{host}/tag/{tag}/feed.rss', format: 'rss' },
  ],
  { hosts: { tenants: domains } },
)

export const parsePikaUrl = (url: string): PikaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !getTenantSubdomain(parsedUrl, domains)) {
    return
  }

  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  return { kind: 'blog' }
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
        page.getFeedEntry('tag', { tag: parsed.tag }, 'atom'),
        page.getFeedEntry('tag', { tag: parsed.tag }, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
      ]
    }

    return [page.getFeedEntry('posts', {}, 'atom'), page.getFeedEntry('posts', {}, 'rss')]
  },

  getFeedHint: feeds.getFeedHint,
}
