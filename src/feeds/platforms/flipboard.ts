import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type FlipboardUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'magazine'; username: string; magazine: string }
  | { kind: 'topic'; topic: string }

export const hosts = ['flipboard.com', 'www.flipboard.com']

// Flipboard redirects these profile tabs to the profile itself.
const profileSubpaths = ['followers', 'following', 'magazines']

const feeds = definePlatformFeeds([
  { key: 'flipboard:profile', template: 'https://flipboard.com/@{username}.rss' },
  { key: 'flipboard:magazine', template: 'https://flipboard.com/@{username}/{magazine}.rss' },
  { key: 'flipboard:topic', template: 'https://flipboard.com/topic/{topic}.rss' },
])

export const parseFlipboardUrl = (url: string): FlipboardUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [routeOrHandle, topicOrMagazine, article] = getPathSegments(url)

  // A third segment is an article flipped into a magazine, which has no feed.
  if (!routeOrHandle || article) {
    return
  }

  if (isAnyOf(routeOrHandle, 'topic')) {
    if (!topicOrMagazine) {
      return
    }

    return { kind: 'topic', topic: topicOrMagazine }
  }

  // Only a leading @ marks a user, so site routes like /explore never read as one.
  if (!routeOrHandle.startsWith('@') || routeOrHandle.length === 1) {
    return
  }

  const username = routeOrHandle.slice(1)

  if (!topicOrMagazine || isAnyOf(topicOrMagazine, profileSubpaths)) {
    return { kind: 'profile', username }
  }

  // Storyboards share the magazine URL shape and its .rss feed.
  return { kind: 'magazine', username, magazine: topicOrMagazine }
}

export const flipboardHandler: PlatformHandler = {
  match: (url) => {
    return parseFlipboardUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFlipboardUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'profile') {
      return [feeds.getFeedEntry('flipboard:profile', { username: parsed.username })]
    }

    if (parsed.kind === 'magazine') {
      const { username, magazine } = parsed

      return [feeds.getFeedEntry('flipboard:magazine', { username, magazine })]
    }

    return [feeds.getFeedEntry('flipboard:topic', { topic: parsed.topic })]
  },

  getFeedHint: feeds.getFeedHint,
}
