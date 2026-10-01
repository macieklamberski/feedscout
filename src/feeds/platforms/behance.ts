import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

export type BehanceUrl = { kind: 'profile'; username: string } | { kind: 'home' }

const hosts = ['behance.net', 'www.behance.net']
// User profile: /{username} or /{username}/appreciated.
const userRegex = /^\/([a-zA-Z0-9_-]+)(?:\/(appreciated))?\/?$/i
const homeRegex = /^\/(?:galleries\/?)?$/i
const excludedPaths = [
  'search',
  'galleries',
  'curated',
  'features',
  'live',
  'joblist',
  'hire',
  'blog',
  'about',
  'privacy',
  'tos',
  'help',
  'onboarding',
  'settings',
  'notifications',
  'messages',
  'adobe',
]

export const parseBehanceUrl = (url: string): BehanceUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // Homepage: featured projects. The page's own FeedBurner link serves the same items.
  if (homeRegex.test(parsedUrl.pathname)) {
    return { kind: 'home' }
  }

  const username = parsedUrl.pathname.match(userRegex)?.[1]

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'profile', username }
}

export const behanceHandler: PlatformHandler = {
  match: (url) => {
    return parseBehanceUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBehanceUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [
        {
          uri: 'https://www.behance.net/feeds/projects',
          hint: composeHint('behance:projects'),
        },
      ]
    }

    // The appreciated page gets the portfolio feed: Behance ignores
    // `content=appreciated` and serves the user's own projects for it.
    return [
      {
        uri: `https://www.behance.net/feeds/user?username=${parsed.username}`,
        hint: composeHint('behance:portfolio'),
      },
    ]
  },
}
