import { getPathSegments, getQueryParam, isAnyOf, isHostOf, isLocale, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers community, home, languageCommunity, officialBlog, userBlog (html).
// Handler needed for: blogPost, officialLegacyPost.

export type LichessUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'community'; language?: string }
  | { kind: 'officialBlog' }

const hosts = ['lichess.org']

const userBlogRegex = /^\/@\/([\w-]+)\/blog(?:\/|$)/i
const communityRegex = /^(?:\/([^/]+))?\/blog\/community\/?$/i

const feeds = definePlatformFeeds([
  { key: 'lichess:blog', template: 'https://lichess.org/@/{username}/blog.atom' },
  { key: 'lichess:blog', template: 'https://lichess.org/blog.atom', isAlias: true },
  { key: 'lichess:community', template: 'https://lichess.org/blog/community.atom?lang={language}' },
  { key: 'lichess:community', template: 'https://lichess.org/blog/community.atom' },
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
  const language = communityMatch?.[1]

  if (communityMatch && (!language || isLocale(language))) {
    return { kind: 'community', language }
  }

  const [section, id, slug, rest] = getPathSegments(url)
  const isOfficialBlog = isAnyOf(section, 'blog') && !id
  const isLegacyPost = isAnyOf(section, 'blog') && slug && !rest && !isAnyOf(id, 'topic')

  // Every other page links only the site-wide updates feed, the platform's own news.
  if (!isOfficialBlog && !isLegacyPost) {
    return
  }

  // Lichess redirects /blog and the old /blog/{id}/{slug} post URLs to the @/Lichess blog.
  return { kind: 'officialBlog' }
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
      return [feeds.getFeedEntry('lichess:community', { language: parsed.language })]
    }

    return [feeds.getFeedEntry('lichess:blog', { username: 'Lichess' })]
  },

  getFeedHint: (url) => {
    const language = getQueryParam(parseUrl(url), 'lang')

    if (language && !isLocale(language)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
