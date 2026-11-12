import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers discover, project (guess, html).
// Handler needed for: home.

export type KickstarterUrl =
  | { kind: 'project'; creator: string; project: string }
  | { kind: 'home' }

const hosts = ['kickstarter.com', 'www.kickstarter.com']

const feeds = definePlatformFeeds([
  {
    key: 'kickstarter:updates',
    template: 'https://www.kickstarter.com/projects/{creator}/{project}/posts.atom',
  },
  { key: 'kickstarter:projects', template: 'https://www.kickstarter.com/projects/feed.atom' },
])

export const parseKickstarterUrl = (url: string): KickstarterUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [route, creator, project] = getPathSegments(url)

  // Project page: kickstarter.com/projects/{creator}/{project}
  if (isAnyOf(route, 'projects') && creator && project) {
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
        feeds.getFeedEntry('kickstarter:updates', {
          creator: parsed.creator,
          project: parsed.project,
        }),
      ]
    }

    // Homepage or discover pages - return global new projects feed.
    return [feeds.getFeedEntry('kickstarter:projects')]
  },

  getFeedKey: feeds.getFeedKey,
}
