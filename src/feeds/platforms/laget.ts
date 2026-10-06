import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type LagetUrl = { kind: 'team'; team: string }

const hosts = ['laget.se', 'www.laget.se']

// Site-wide routes on the team host, beside site files such as `Price.html`.
const excludedPaths = ['common', 'content', 'cupguide', 'cupguiden', 'handlers', 'login']

export const parseLagetUrl = (url: string): LagetUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [team] = getPathSegments(url)

  if (!team || team.includes('.') || isAnyOf(team, excludedPaths)) {
    return
  }

  return { kind: 'team', team }
}

export const lagetHandler: PlatformHandler = {
  match: (url) => {
    return parseLagetUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLagetUrl(url)

    if (!parsed) {
      return []
    }

    // The team page links its feed with the team spelled as the request spelled it.
    return [
      {
        uri: `https://www.laget.se/${parsed.team}/Home/NewsRss`,
        hint: composeHint('laget:news'),
      },
    ]
  },
}
