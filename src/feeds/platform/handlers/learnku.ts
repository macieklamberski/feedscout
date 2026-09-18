import { isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// LearnKu serves a site feed at `/feed` and a per-community feed at
// `/{community}/feed`. Community pages carry no `alternate` link.
//
// Not every first path segment is a community, and the response body opens
// directly with `<rss` and no XML declaration.

const hosts = ['learnku.com', 'www.learnku.com']
const excludedPaths = ['search', 'login', 'register', 'settings', 'notifications', 'users', 'api']

const getCommunity = (url: string): string | undefined => {
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  if (!first || isAnyOf(first, excludedPaths)) {
    return
  }

  return first
}

export const learnkuHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)
      const community = getCommunity(url)
      const uris: Array<DiscoverUriEntry> = []

      if (community) {
        uris.push({
          uri: `${origin}/${community}/feed`,
          hint: composeHint('learnku:community'),
        })
      }

      uris.push({ uri: `${origin}/feed`, hint: composeHint('learnku:site') })

      return uris
    } catch {}

    return []
  },
}
