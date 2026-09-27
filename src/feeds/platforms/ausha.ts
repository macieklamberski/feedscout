import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers smartlink, smartlinkEpisode (html).
// Handler needed for: episode, show.

const hosts = ['podcast.ausha.co', 'smartlink.ausha.co']

// The feed id is opaque: show and episode pages carry it only in the markup.
const feedIdRegex = /feed\.ausha\.co\/(\w+)/

const excludedPaths = [
  'c', // Channel pages, which list several shows
]

export const aushaHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    const [slug] = getPathSegments(url)

    return !!slug && !isAnyOf(slug, excludedPaths)
  },

  resolve: (_url, content) => {
    const id = content?.match(feedIdRegex)?.[1]

    if (!id) {
      return []
    }

    return [{ uri: `https://feed.ausha.co/${id}`, hint: composeHint('ausha:podcast') }]
  },
}
