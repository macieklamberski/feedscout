import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers archive, blog, category, photos, replies.

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
  [
    {
      key: 'microblog:category',
      main: '{scheme}://{host}/categories/{category}/feed.xml',
      format: 'rss',
    },
    {
      key: 'microblog:category',
      main: '{scheme}://{host}/categories/{category}/feed.json',
      format: 'json',
    },
    { key: 'microblog:archive', main: '{scheme}://{host}/archive/index.json' },
    { key: 'microblog:photos', main: '{scheme}://{host}/photos/index.json' },
    {
      key: 'microblog:posts',
      main: '{scheme}://{host}/feed.xml',
      format: 'rss',
      aliases: [
        // replies.xml redirects to feed.xml, so a stored one is the posts feed.
        '{scheme}://{host}/replies.xml',
      ],
    },
    { key: 'microblog:posts', main: '{scheme}://{host}/feed.json', format: 'json' },
    { key: 'microblog:podcast', main: '{scheme}://{host}/podcast.xml', format: 'rss' },
    { key: 'microblog:podcast', main: '{scheme}://{host}/podcast.json', format: 'json' },
  ],
  { domains },
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
        page.getFeedEntry('microblog:category', params, 'rss'),
        page.getFeedEntry('microblog:category', params, 'json'),
        page.getFeedEntry('microblog:posts', {}, 'rss'),
        page.getFeedEntry('microblog:posts', {}, 'json'),
        page.getFeedEntry('microblog:podcast', {}, 'rss'),
        page.getFeedEntry('microblog:podcast', {}, 'json'),
        page.getFeedEntry('microblog:archive'),
        page.getFeedEntry('microblog:photos'),
      ]
    }

    if (parsed.kind === 'archive') {
      return [
        page.getFeedEntry('microblog:archive'),
        page.getFeedEntry('microblog:posts', {}, 'rss'),
        page.getFeedEntry('microblog:posts', {}, 'json'),
        page.getFeedEntry('microblog:podcast', {}, 'rss'),
        page.getFeedEntry('microblog:podcast', {}, 'json'),
        page.getFeedEntry('microblog:photos'),
      ]
    }

    if (parsed.kind === 'photos') {
      return [
        page.getFeedEntry('microblog:photos'),
        page.getFeedEntry('microblog:posts', {}, 'rss'),
        page.getFeedEntry('microblog:posts', {}, 'json'),
        page.getFeedEntry('microblog:podcast', {}, 'rss'),
        page.getFeedEntry('microblog:podcast', {}, 'json'),
        page.getFeedEntry('microblog:archive'),
      ]
    }

    return [
      page.getFeedEntry('microblog:posts', {}, 'rss'),
      page.getFeedEntry('microblog:posts', {}, 'json'),
      page.getFeedEntry('microblog:podcast', {}, 'rss'),
      page.getFeedEntry('microblog:podcast', {}, 'json'),
      page.getFeedEntry('microblog:archive'),
      page.getFeedEntry('microblog:photos'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
