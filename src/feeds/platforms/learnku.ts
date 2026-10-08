import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers other (guess, html), partly covers community.

export type LearnkuUrl = { kind: 'community'; community: string } | { kind: 'home' }

const hosts = ['learnku.com', 'www.learnku.com']
const excludedPaths = ['search', 'login', 'register', 'settings', 'notifications', 'users', 'api']

export const parseLearnkuUrl = (url: string): LearnkuUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [community] = getPathSegments(url)

  if (!community || isAnyOf(community, excludedPaths)) {
    return { kind: 'home' }
  }

  return { kind: 'community', community }
}

export const learnkuHandler: PlatformHandler = {
  match: (url) => {
    return parseLearnkuUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLearnkuUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'community') {
      uris.push({
        uri: `${origin}/${parsed.community}/feed`,
        hint: composeHint('learnku:community'),
      })
    }

    uris.push({ uri: `${origin}/feed`, hint: composeHint('learnku:site') })

    return uris
  },
}
