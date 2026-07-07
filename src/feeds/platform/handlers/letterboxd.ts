import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Letterboxd serves one RSS 2.0 feed per member at
// `letterboxd.com/{user}/rss/` (diary entries, reviews, list creations) plus
// the editorial `letterboxd.com/journal/rss/`. The member page advertises the
// feed via `<link rel="alternate" type="application/rss+xml">`, but profile
// pages sit behind a Cloudflare challenge that blocks a plain fetch, so
// generic discovery cannot read the link. The handler builds `/{user}/rss/`
// from the URL without fetching. There is no native watchlist or per-list RSS.

const hosts = ['letterboxd.com', 'www.letterboxd.com']
const excludedPaths = [
  'about',
  'activity',
  'api-beta',
  'apps',
  'contact',
  'create-account',
  'films',
  'journal',
  'legal',
  'lists',
  'members',
  'news',
  'pro',
  'search',
  'settings',
  'showdown',
  'sign-in',
  'welcome',
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
