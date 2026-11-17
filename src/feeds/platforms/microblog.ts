import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, posts.
// Handler needed for: archive, photos, podcast.

export type MicroblogUrl =
  | { kind: 'category'; username: string; category: string }
  | { kind: 'archive'; username: string }
  | { kind: 'photos'; username: string }
  | { kind: 'blog'; username: string }

export const domains = ['micro.blog']

const categoryRegex = /^\/categories\/([^/]+)/i
const archiveRegex = /^\/archive(?:\/|$)/i
const photosRegex = /^\/photos(?:\/|$)/i

const feeds = definePlatformFeeds(
  'microblog',
  [
    {
      key: 'category',
      main: '{scheme}://{host}/categories/{category}/feed.xml',
      format: 'rss',
    },
    {
      key: 'category',
      main: '{scheme}://{host}/categories/{category}/feed.json',
      format: 'json',
    },
    { key: 'archive', main: '{scheme}://{host}/archive/index.json' },
    { key: 'photos', main: '{scheme}://{host}/photos/index.json' },
    {
      key: 'posts',
      main: '{scheme}://{host}/feed.xml',
      format: 'rss',
      aliases: [
        // replies.xml redirects to feed.xml, so a stored one is the posts feed.
        '{scheme}://{host}/replies.xml',
      ],
    },
    { key: 'posts', main: '{scheme}://{host}/feed.json', format: 'json' },
    { key: 'podcast', main: '{scheme}://{host}/podcast.xml', format: 'rss' },
    { key: 'podcast', main: '{scheme}://{host}/podcast.json', format: 'json' },
  ],
  { hosts: { tenants: domains } },
)

export const parseMicroblogUrl = (url: string): MicroblogUrl | undefined => {
  const parsedUrl = parseUrl(url)
  const username = getTenantSubdomain(url, domains)

  if (!parsedUrl || !username) {
    return
  }

  const { pathname } = parsedUrl
  const category = pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', username, category }
  }

  if (archiveRegex.test(pathname)) {
    return { kind: 'archive', username }
  }

  if (photosRegex.test(pathname)) {
    return { kind: 'photos', username }
  }

  return { kind: 'blog', username }
}

export const microblogHandler: PlatformHandler = {
  match: (url) => {
    return parseMicroblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMicroblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The posts, podcast, archive and photos feeds need no value from the page, so every page
    // builds them after its own feeds.
    if (parsed.kind === 'category') {
      const params = { category: parsed.category }

      return [
        page.getFeedEntry('category', params, 'rss'),
        page.getFeedEntry('category', params, 'json'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'json'),
        page.getFeedEntry('podcast', {}, 'rss'),
        page.getFeedEntry('podcast', {}, 'json'),
        page.getFeedEntry('archive'),
        page.getFeedEntry('photos'),
      ]
    }

    if (parsed.kind === 'archive') {
      return [
        page.getFeedEntry('archive'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'json'),
        page.getFeedEntry('podcast', {}, 'rss'),
        page.getFeedEntry('podcast', {}, 'json'),
        page.getFeedEntry('photos'),
      ]
    }

    if (parsed.kind === 'photos') {
      return [
        page.getFeedEntry('photos'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'json'),
        page.getFeedEntry('podcast', {}, 'rss'),
        page.getFeedEntry('podcast', {}, 'json'),
        page.getFeedEntry('archive'),
      ]
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'json'),
      page.getFeedEntry('podcast', {}, 'rss'),
      page.getFeedEntry('podcast', {}, 'json'),
      page.getFeedEntry('archive'),
      page.getFeedEntry('photos'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
