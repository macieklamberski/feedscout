import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers community, home, languageCommunity, officialBlog, userBlog (html).
// Handler needed for: blogPost, officialLegacyPost.

export type LichessUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'community'; language?: string }
  | { kind: 'officialBlog' }
  | { kind: 'home' }

const hosts = ['lichess.org']

const userBlogRegex = /^\/@\/([\w-]+)\/blog(?:\/|$)/i
const communityRegex = /^(?:\/(\w+))?\/blog\/community\/?$/i

const feeds = definePlatformFeeds([
  { key: 'lichess:blog', template: 'https://lichess.org/@/{username}/blog.atom' },
  { key: 'lichess:community', template: 'https://lichess.org/blog/community.atom?lang={language}' },
  { key: 'lichess:community', template: 'https://lichess.org/blog/community.atom' },
  { key: 'lichess:updates', template: 'https://lichess.org/feed.atom' },
])

export const parseLichessUrl = (url: string): LichessUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  const username = pathname.match(userBlogRegex)?.[1]

  // User blog and its posts: /@/{user}/blog and /@/{user}/blog/{slug}/{id}.
  if (username) {
    return { kind: 'blog', username }
  }

  const communityMatch = pathname.match(communityRegex)

  if (communityMatch) {
    return { kind: 'community', language: communityMatch[1] }
  }

  const [section, id, slug, rest] = getPathSegments(url)
  const isOfficialBlog = isAnyOf(section, 'blog') && !id
  const isLegacyPost = isAnyOf(section, 'blog') && slug && !rest && !isAnyOf(id, 'topic')

  // Lichess redirects /blog and the old /blog/{id}/{slug} post URLs to the @/Lichess blog.
  if (isOfficialBlog || isLegacyPost) {
    return { kind: 'officialBlog' }
  }

  // Every other page, profiles included, advertises the site-wide updates feed.
  return { kind: 'home' }
}

export const lichessHandler: PlatformHandler = {
  match: (url) => {
    return parseLichessUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLichessUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'blog') {
      return [feeds.getFeedEntry('lichess:blog', { username: parsed.username })]
    }

    if (parsed.kind === 'community') {
      const params = parsed.language ? { language: parsed.language } : undefined

      return [feeds.getFeedEntry('lichess:community', params)]
    }

    if (parsed.kind === 'officialBlog') {
      return [feeds.getFeedEntry('lichess:blog', { username: 'Lichess' })]
    }

    return [feeds.getFeedEntry('lichess:updates')]
  },

  getFeedKey: feeds.getFeedKey,
}
