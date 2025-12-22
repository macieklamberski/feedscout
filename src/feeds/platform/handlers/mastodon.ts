import type { PlatformHandler } from '../../../common/uris/platform/types.js'

// Note: For comprehensive Fediverse support, consider content-based detection
// by checking for <meta name="generator" content="Mastodon ..."> in HTML.

const knownInstances = [
  // Large general-purpose instances.
  'mastodon.social',
  'mastodon.online',
  'mastodon.world',
  'mstdn.social',
  'mas.to',
  'universeodon.com',
  'c.im',
  'social.vivaldi.net',
  'masto.ai',
  'mastodon.cloud',
  // Tech-focused instances.
  'fosstodon.org',
  'hachyderm.io',
  'infosec.exchange',
  'techhub.social',
  'phpc.social',
  'ruby.social',
  'functional.cafe',
  'toot.cafe',
  'mathstodon.xyz',
  // Regional instances.
  'aus.social',
  'nrw.social',
  'chaos.social',
  'social.tchncs.de',
  'piaille.fr',
  'mamot.fr',
  // Community instances.
  'social.coop',
  'wandering.shop',
  'tabletop.social',
  'metalhead.club',
  'mindly.social',
  // Other Fediverse software (compatible RSS format).
  'pixelfed.social',
  'kolektiva.social',
]

const isMastodonInstance = (hostname: string): boolean => {
  if (knownInstances.includes(hostname)) {
    return true
  }

  // Match common Mastodon instance naming patterns.
  if (
    hostname.startsWith('mastodon.') ||
    hostname.startsWith('mstdn.') ||
    hostname.startsWith('social.') ||
    hostname.startsWith('toot.')
  ) {
    return true
  }

  return false
}

export const mastodonHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    if (!isMastodonInstance(hostname)) {
      return false
    }

    // Match user profiles (/@user) or hashtag pages (/tags/).
    return parsedUrl.pathname.startsWith('/@') || parsedUrl.pathname.startsWith('/tags/')
  },

  resolve: (url) => {
    const parsedUrl = new URL(url)

    // User profile: /@username.
    const userMatch = parsedUrl.pathname.match(/^\/@([^/]+)/)

    if (userMatch?.[1]) {
      return [`${parsedUrl.origin}/@${userMatch[1]}.rss`]
    }

    // Hashtag: /tags/tagname.
    const tagMatch = parsedUrl.pathname.match(/^\/tags\/([^/]+)/)

    if (tagMatch?.[1]) {
      return [`${parsedUrl.origin}/tags/${tagMatch[1]}.rss`]
    }

    return []
  },
}
