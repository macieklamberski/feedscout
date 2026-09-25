import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LetterboxdUrl = { kind: 'member'; username: string }

const hosts = ['letterboxd.com', 'www.letterboxd.com']
const excludedPaths = [
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

export const parseLetterboxdUrl = (url: string): LetterboxdUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'member', username }
}

export const letterboxdHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const [section] = getPathSegments(url)

    // Editorial Letterboxd Journal feed.
    if (section === 'journal') {
      return [
        {
          uri: 'https://letterboxd.com/journal/rss/',
          hint: composeHint('letterboxd:journal'),
        },
      ]
    }

    const parsed = parseLetterboxdUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://letterboxd.com/${parsed.username}/rss/`,
        hint: composeHint('letterboxd:diary'),
      },
    ]
  },
}
