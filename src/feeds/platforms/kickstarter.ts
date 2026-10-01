import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers discover (guess, html).
// Handler needed for: home, project.

export type KickstarterUrl =
  | { kind: 'project'; creator: string; project: string }
  | { kind: 'home' }

const hosts = ['kickstarter.com', 'www.kickstarter.com']

export const parseKickstarterUrl = (url: string): KickstarterUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [first, creator, project] = getPathSegments(url)

  // Project page: kickstarter.com/projects/{creator}/{project}
  if (isAnyOf(first, 'projects') && creator && project) {
    return { kind: 'project', creator, project }
  }

  return { kind: 'home' }
}

export const kickstarterHandler: PlatformHandler = {
  match: (url) => {
    return parseKickstarterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseKickstarterUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'project') {
      return [
        {
          uri: `https://www.kickstarter.com/projects/${parsed.creator}/${parsed.project}/posts.atom`,
          hint: composeHint('kickstarter:updates'),
        },
      ]
    }

    // Homepage or discover pages - return global new projects feed.
    return [
      {
        uri: 'https://www.kickstarter.com/projects/feed.atom',
        hint: composeHint('kickstarter:projects'),
      },
    ]
  },
}
