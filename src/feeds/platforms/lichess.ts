import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers community, home, languageCommunity, officialBlog, userBlog (html).
// Handler needed for: blogPost, officialLegacyPost.

const hosts = ['lichess.org']

const userBlogRegex = /^\/@\/([\w-]+)\/blog(?:\/|$)/i
const communityRegex = /^(?:\/(\w{2,3}))?\/blog\/community\/?$/i

export const lichessHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const username = pathname.match(userBlogRegex)?.[1]

    // User blog and its posts: /@/{user}/blog and /@/{user}/blog/{slug}/{id}.
    if (username) {
      return [
        {
          uri: `https://lichess.org/@/${username}/blog.atom`,
          hint: composeHint('lichess:blog'),
        },
      ]
    }

    const communityMatch = pathname.match(communityRegex)

    if (communityMatch) {
      // An uppercase language code falls back to the feed of every language.
      const language = communityMatch[1]?.toLowerCase()
      const query = language ? `?lang=${language}` : ''

      return [
        {
          uri: `https://lichess.org/blog/community.atom${query}`,
          hint: composeHint('lichess:community'),
        },
      ]
    }

    const [section, id, slug, rest] = getPathSegments(url)
    const isOfficialBlog = isAnyOf(section, 'blog') && !id
    const isLegacyPost = isAnyOf(section, 'blog') && slug && !rest && !isAnyOf(id, 'topic')

    // Lichess redirects /blog and the old /blog/{id}/{slug} post URLs to the @/Lichess blog.
    if (isOfficialBlog || isLegacyPost) {
      return [
        {
          uri: 'https://lichess.org/@/Lichess/blog.atom',
          hint: composeHint('lichess:blog'),
        },
      ]
    }

    // Every other page, profiles included, advertises the site-wide updates feed.
    return [
      {
        uri: 'https://lichess.org/feed.atom',
        hint: composeHint('lichess:updates'),
      },
    ]
  },
}
