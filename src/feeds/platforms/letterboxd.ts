import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export const hosts = ['letterboxd.com', 'www.letterboxd.com']
export const excludedPaths = [
  'about',
  'activity',
  'actor',
  'api-beta',
  'apps',
  'contact',
  'create-account',
  'director',
  'film',
  'films',
  'genre',
  'journal',
  'legal',
  'lists',
  'members',
  'news',
  'pro',
  'producer',
  'search',
  'settings',
  'showdown',
  'sign-in',
  'studio',
  'welcome',
  'writer',
  'year-in-review',
]

export const letterboxdHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    // Editorial Letterboxd Journal feed.
    if (pathSegments[0] === 'journal') {
      return [
        {
          uri: 'https://letterboxd.com/journal/rss/',
          hint: composeHint('letterboxd:journal'),
        },
      ]
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://letterboxd.com/${username}/rss/`,
        hint: composeHint('letterboxd:diary'),
      },
    ]
  },
}
