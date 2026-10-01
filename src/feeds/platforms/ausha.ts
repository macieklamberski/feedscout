import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers smartlink, smartlinkEpisode (html).
// Handler needed for: episode, show.

export type AushaUrl = { kind: 'show' }

const hosts = ['podcast.ausha.co', 'smartlink.ausha.co']

// The feed id is opaque: show and episode pages carry it only in the markup.
const feedIdRegex = /feed\.ausha\.co\/(\w+)/

const excludedPaths = [
  'c', // Channel pages, which list several shows
]

export const parseAushaUrl = (url: string): AushaUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [slug] = getPathSegments(url)

  if (!slug || isAnyOf(slug, excludedPaths)) {
    return
  }

  return { kind: 'show' }
}

export const aushaHandler: PlatformHandler = {
  match: (url) => {
    return parseAushaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    if (!parseAushaUrl(url)) {
      return []
    }

    const id = content?.match(feedIdRegex)?.[1]

    if (!id) {
      return []
    }

    return [{ uri: `https://feed.ausha.co/${id}`, hint: composeHint('ausha:podcast') }]
  },
}
