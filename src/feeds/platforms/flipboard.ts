import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FlipboardUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'magazine'; username: string; magazine: string }
  | { kind: 'topic'; topic: string }

export const hosts = ['flipboard.com', 'www.flipboard.com']

// Flipboard redirects these profile tabs to the profile itself.
const profileSubpaths = ['followers', 'following', 'magazines']

export const parseFlipboardUrl = (url: string): FlipboardUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [first, second, third] = getPathSegments(url)

  // A third segment is an article flipped into a magazine, which has no feed.
  if (!first || third) {
    return
  }

  if (isAnyOf(first, 'topic')) {
    if (!second) {
      return
    }

    return { kind: 'topic', topic: second }
  }

  // Only a leading @ marks a user, so site routes like /explore never read as one.
  if (!first.startsWith('@') || first.length === 1) {
    return
  }

  const username = first.slice(1)

  if (!second || isAnyOf(second, profileSubpaths)) {
    return { kind: 'profile', username }
  }

  // Storyboards share the magazine URL shape and its .rss feed.
  return { kind: 'magazine', username, magazine: second }
}

export const flipboardHandler: PlatformHandler = {
  match: (url) => {
    return !!parseFlipboardUrl(url)
  },

  resolve: (url) => {
    const parsed = parseFlipboardUrl(url)

    if (parsed?.kind === 'profile') {
      return [
        {
          uri: `https://flipboard.com/@${parsed.username}.rss`,
          hint: composeHint('flipboard:profile'),
        },
      ]
    }

    if (parsed?.kind === 'magazine') {
      return [
        {
          uri: `https://flipboard.com/@${parsed.username}/${parsed.magazine}.rss`,
          hint: composeHint('flipboard:magazine'),
        },
      ]
    }

    if (parsed?.kind === 'topic') {
      return [
        {
          uri: `https://flipboard.com/topic/${parsed.topic}.rss`,
          hint: composeHint('flipboard:topic'),
        },
      ]
    }

    return []
  },
}
