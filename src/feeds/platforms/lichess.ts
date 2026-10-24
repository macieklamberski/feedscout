import { composeQuery, getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

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
      return [
        {
          uri: `https://lichess.org/@/${parsed.username}/blog.atom`,
          hint: composeHint('lichess:blog'),
        },
      ]
    }

    if (parsed.kind === 'community') {
      const { language } = parsed
      const query = language ? composeQuery({ lang: language }) : ''

      return [
        {
          uri: `https://lichess.org/blog/community.atom${query}`,
          hint: composeHint('lichess:community'),
        },
      ]
    }

    if (parsed.kind === 'officialBlog') {
      return [
        {
          uri: 'https://lichess.org/@/Lichess/blog.atom',
          hint: composeHint('lichess:blog'),
        },
      ]
    }

    return [
      {
        uri: 'https://lichess.org/feed.atom',
        hint: composeHint('lichess:updates'),
      },
    ]
  },
}
