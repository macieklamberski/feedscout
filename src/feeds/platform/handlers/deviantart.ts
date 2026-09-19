import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// DeviantArt feeds live off-domain on `backend.deviantart.com/rss.xml` and
// are driven by query parameters (`q=tag:…`, `q=gallery:…`, `q=favby:…`,
// `q=journal:…`, `q=special:dd`, `q=boost:popular`); pages on
// `www.deviantart.com` do not advertise them via HTML `<link rel="alternate">`
// or HTTP Link headers. The handler is needed to translate tag, user,
// gallery, journal, favourites, daily-deviations, and popular URLs into
// the appropriate backend query.

const tagRegex = /^\/tag\/([^/]+)/
const favouritesRegex = /^\/([a-zA-Z0-9_-]+)\/favourites\/?$/
const folderRegex = /^\/([a-zA-Z0-9_-]+)\/gallery\/(\d+)(?:\/|$)/
const journalRegex = /^\/([a-zA-Z0-9_-]+)\/journal(?:\/|$)/
const profileRegex = /^\/([a-zA-Z0-9_-]+)(?:\/gallery(?:\/all)?)?(?:\/|$)/

export const hosts = ['deviantart.com', 'www.deviantart.com']
const feedBaseUrl = 'https://backend.deviantart.com/rss.xml'
export const excludedPaths = [
  'about',
  'core-membership',
  'daily-deviations',
  'developers',
  'join',
  'notifications',
  'popular',
  'search',
  'settings',
  'shop',
  'submit',
  'team',
  'topic',
  'watch',
]

export const deviantartHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Site-wide curated feeds.
    if (pathname === '/daily-deviations' || pathname === '/daily-deviations/') {
      return [
        {
          uri: `${feedBaseUrl}?q=${encodeURIComponent('special:dd')}`,
          hint: composeHint('deviantart:daily-deviations'),
        },
      ]
    }

    if (pathname === '/popular' || pathname === '/popular/') {
      return [
        {
          uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent('boost:popular')}`,
          hint: composeHint('deviantart:popular'),
        },
      ]
    }

    // Match tag page: /tag/{tagname}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [
        {
          uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`tag:${tag}`)}`,
          hint: composeHint('deviantart:tag'),
        },
      ]
    }

    // Match favourites: /{username}/favourites
    const favMatch = pathname.match(favouritesRegex)

    if (favMatch?.[1]) {
      const username = favMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`favby:${username}`)}`,
            hint: composeHint('deviantart:favorites'),
          },
        ]
      }
    }

    // Match gallery folder: /{username}/gallery/{folder-id}/{folder-name}.
    const folderMatch = pathname.match(folderRegex)

    if (folderMatch?.[1] && folderMatch?.[2]) {
      const username = folderMatch[1]
      const folderId = folderMatch[2]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(`gallery:${username}/${folderId}`)}`,
            hint: composeHint('deviantart:gallery'),
          },
        ]
      }
    }

    // Match journal: /{username}/journal or /{username}/journal/{slug}
    const journalMatch = pathname.match(journalRegex)

    if (journalMatch?.[1]) {
      const username = journalMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `${feedBaseUrl}?q=${encodeURIComponent(`journal:${username}`)}`,
            hint: composeHint('deviantart:journal'),
          },
        ]
      }
    }

    // Match username from profile/gallery paths like:
    // /{username}
    // /{username}/gallery
    // /{username}/gallery/all
    const userMatch = pathname.match(profileRegex)
    const username = userMatch?.[1]

    if (!username || isAnyOf(username, excludedPaths)) {
      return []
    }

    // Build RSS feed URL with query for user's deviations sorted by time.
    const query = `by:${username} sort:time meta:all`

    return [
      {
        uri: `${feedBaseUrl}?type=deviation&q=${encodeURIComponent(query)}`,
        hint: composeHint('deviantart:deviations'),
      },
    ]
  },
}
