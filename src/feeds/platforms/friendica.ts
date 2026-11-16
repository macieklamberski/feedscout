import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FriendicaUrl = { kind: 'profile'; username: string }

const profileRegex = /^\/(?:profile\/|u\/|~)([^/]+)/i

// A server is self-hosted on any domain, so the table only builds its feeds.
const feeds = definePlatformFeeds([
  { key: 'friendica:posts', main: '{root}/feed/{username}' },
  { key: 'friendica:comments', main: '{root}/feed/{username}/comments' },
  { key: 'friendica:replies', main: '{root}/feed/{username}/replies' },
  { key: 'friendica:activity', main: '{root}/feed/{username}/activity' },
])

export const isFriendicaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Friendica')
}

export const isFriendicaHeaders = (headers: Headers): boolean => {
  return headers.has('x-friendica-version')
}

export const parseFriendicaUrl = (url: string): FriendicaUrl | undefined => {
  const username = new URL(url).pathname.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const friendicaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (parseFriendicaUrl(url) === undefined) {
      return false
    }

    return hasMarker(content, headers, { html: isFriendicaHtml, headers: isFriendicaHeaders })
  },

  resolve: (url) => {
    const parsed = parseFriendicaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const { username } = parsed

    return [
      page.getFeedEntry('friendica:posts', { username }),
      page.getFeedEntry('friendica:comments', { username }),
      page.getFeedEntry('friendica:replies', { username }),
      page.getFeedEntry('friendica:activity', { username }),
    ]
  },
}
