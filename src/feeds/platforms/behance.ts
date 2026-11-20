import { behance } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: projects.
// Handler needed for: portfolio.

export type BehanceUrl = { kind: 'profile'; username: string } | { kind: 'home' }

const hosts = behance.hosts.exact
// Profile tabs of a user, which map back to the user.
const profileTabs = [
  'analytics',
  'appreciated',
  'followers',
  'following',
  'info',
  'moodboards',
  'projects',
  'resume',
  'services',
]
// Site routes whose tabs share the profile tab names, as /search/projects does.
const sitePaths = ['search']

const usernameRegex = /^[a-zA-Z0-9_-]+$/
const homeRegex = /^\/(?:galleries\/?)?$/i

const feeds = withHintLabels(behance.feeds)

export const parseBehanceUrl = (url: string): BehanceUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // Homepage: featured projects. The page's own FeedBurner link serves the same items.
  if (homeRegex.test(parsedUrl.pathname)) {
    return { kind: 'home' }
  }

  const [username, tab, ...rest] = getPathSegments(parsedUrl)

  if (
    !username ||
    !usernameRegex.test(username) ||
    isAnyOf(username, sitePaths) ||
    rest.length > 0
  ) {
    return { kind: 'home' }
  }

  if (tab && !isAnyOf(tab, profileTabs)) {
    return { kind: 'home' }
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

    // The featured projects feed needs no value from the page, so every page builds it after its
    // own feeds.
    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('projects')]
    }

    // The appreciated page gets the portfolio feed: Behance ignores
    // `content=appreciated` and serves the user's own projects for it.
    return [
      feeds.getFeedEntry('portfolio', { username: parsed.username }),
      feeds.getFeedEntry('projects'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
