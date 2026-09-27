import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers post, user, userPath (guess, html).
// Handler needed for: mobile, mobilePost.

const hosts = ['plurk.com', 'www.plurk.com']

// A root `.xml` path is a user's feed, so a guessed /feed.xml is the feed of a user named feed.
const userFeedRegex = /^https?:\/\/(?:www\.)?plurk\.com\/[^/]+\.xml$/i

// Plurk routes a single segment to a user, and users named after these routes exist, like
// top.xml and news.xml, so the route answers with its own page.
const excludedPaths = [
  'aboutUs',
  'Admin',
  'Affiliate',
  'anonymous',
  'anonymous-rule',
  'API',
  'app',
  'BookmarkTags',
  'bookmarks',
  'brandInfo',
  'contact',
  'content-policy',
  'embed',
  'follows',
  'Friends',
  'help',
  'hotlinks',
  'IM',
  'limitation-info',
  'login',
  'news',
  'Notifications',
  'portal',
  'Premium',
  'privacy',
  'redeemByURL',
  'redeemInvite',
  'search',
  'settings',
  'signup',
  'support',
  'terms',
  'time-machine',
  'top',
  'upvote',
  'user',
  'Verify',
]
// Routes of the mobile app under /m/ that are not a user.
const mobilePaths = [
  'e',
  'follows',
  'notify',
  'profile',
  'purchase',
  'search',
  'settings',
  'wallet',
]

export const plurkHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const segments = getPathSegments(url)
    const isMobile = isAnyOf(segments[0], 'm')
    const [route, value] = isMobile ? segments.slice(1) : segments

    if (isAnyOf(route, 'p')) {
      if (!value) {
        return []
      }

      return [
        {
          uri: `https://www.plurk.com/p/${value}.xml`,
          hint: composeHint('plurk:responses'),
        },
      ]
    }

    const username = isAnyOf(route, 'u') ? value : route

    if (!username || isAnyOf(username, isMobile ? mobilePaths : excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://www.plurk.com/${username}.xml`,
        hint: composeHint('plurk:plurks'),
      },
    ]
  },

  guessExclusionRegex: userFeedRegex,
}
