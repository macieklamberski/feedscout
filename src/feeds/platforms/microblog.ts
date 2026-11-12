import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
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

const feeds = definePlatformFeeds([
  {
    key: 'microblog:category',
    template: 'https://{username}.micro.blog/categories/{category}/feed.xml',
    format: 'rss',
  },
  {
    key: 'microblog:category',
    template: 'https://{username}.micro.blog/categories/{category}/feed.json',
    format: 'json',
  },
  { key: 'microblog:archive', template: 'https://{username}.micro.blog/archive/index.json' },
  { key: 'microblog:photos', template: 'https://{username}.micro.blog/photos/index.json' },
  { key: 'microblog:posts', template: 'https://{username}.micro.blog/feed.xml', format: 'rss' },
  { key: 'microblog:posts', template: 'https://{username}.micro.blog/feed.json', format: 'json' },
  // replies.xml redirects to feed.xml, so a stored one is the posts feed.
  { key: 'microblog:posts', template: 'https://{username}.micro.blog/replies.xml', format: 'rss' },
  {
    key: 'microblog:podcast',
    template: 'https://{username}.micro.blog/podcast.xml',
    format: 'rss',
  },
  {
    key: 'microblog:podcast',
    template: 'https://{username}.micro.blog/podcast.json',
    format: 'json',
  },
])

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

    if (!parsed) {
      return []
    }

    const { username } = parsed
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      const params = { username, category: parsed.category }

      uris.push(
        feeds.getFeedEntry('microblog:category', params, 'rss'),
        feeds.getFeedEntry('microblog:category', params, 'json'),
      )
    }

    if (parsed.kind === 'archive') {
      uris.push(feeds.getFeedEntry('microblog:archive', { username }))
    }

    if (parsed.kind === 'photos') {
      uris.push(feeds.getFeedEntry('microblog:photos', { username }))
    }

    uris.push(
      feeds.getFeedEntry('microblog:posts', { username }, 'rss'),
      feeds.getFeedEntry('microblog:posts', { username }, 'json'),
      feeds.getFeedEntry('microblog:podcast', { username }, 'rss'),
      feeds.getFeedEntry('microblog:podcast', { username }, 'json'),
    )

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
