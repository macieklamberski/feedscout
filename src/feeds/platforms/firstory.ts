import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['open.firstory.me', 'open.firstory.fm']
const domains = ['firstory.cc']

// The feed is keyed by the show's cuid, and the vanity-slug form of it answers 403.
// Show, episode and firstory.cc pages each link the show's feed.
const feedUrlRegex = /feed\.firstory\.me\/rss\/user\/([a-z\d]+)/

export type FirstoryPage = { kind: 'show'; cuid: string }

export const getFirstoryPage = (
  url: string,
  content: string | undefined,
): FirstoryPage | undefined => {
  if (!isHostOf(url, hosts) && !isSubdomainOf(url, domains)) {
    return
  }

  const cuid = content?.match(feedUrlRegex)?.[1]

  if (!cuid) {
    return
  }

  return { kind: 'show', cuid }
}

export const firstoryHandler: PlatformHandler = {
  match: (url, content) => {
    return getFirstoryPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getFirstoryPage(url, content)

    if (!page) {
      return []
    }

    return [
      {
        uri: `https://feed.firstory.me/rss/user/${page.cuid}`,
        hint: composeHint('firstory:podcast'),
      },
    ]
  },
}
