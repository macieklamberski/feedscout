import { lichess } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, isLocale, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type LichessUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'community'; language?: string }
  | { kind: 'officialBlog' }

const hosts = lichess.hosts.exact

const userBlogRegex = /^\/@\/([\w-]+)\/blog(?:\/|$)/i
const communityRegex = /^(?:\/([^/]+))?\/blog\/community\/?$/i

const feeds = withHintLabels(lichess.feeds)

export const parseLichessUrl = (url: string): LichessUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
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
      return [feeds.getFeedEntry('blog', { username: parsed.username })]
    }

    if (parsed.kind === 'community') {
      return [feeds.getFeedEntry('community', { language: parsed.language })]
    }

    return [feeds.getFeedEntry('blog', { username: 'Lichess' })]
  },

  getFeedHint: feeds.getFeedHint,
}
