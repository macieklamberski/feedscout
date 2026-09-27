import { getAnyOf, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers favorites, photostream (html), partly covers group.
// Handler needed for: tag.

export type FlickrUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'photostream'; userId: string }
  | { kind: 'favorites'; userId: string }
  | { kind: 'albums'; userId: string }
  | { kind: 'galleries'; userId: string }
  | { kind: 'subpage'; userId: string }
  | { kind: 'group'; group: string; section?: string }

const hosts = ['flickr.com', 'www.flickr.com']
const feedsBase = 'https://www.flickr.com/services/feeds'

const tagRegex = /^\/photos\/tags\/([^/]+)/i
const groupRegex = /^\/groups\/([^/]+)(?:\/([^/]+))?/i
const forumRegex = /^\/help\/forum(?:\/|$)/i
const nsidRegex = /^\d+@N\d+$/

const groupSections = ['pool', 'discuss']

export const parseFlickrUrl = (url: string): FlickrUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const [prefix, userId, section, ...rest] = getPathSegments(parsedUrl)

  // The user is an NSID such as 12345678@N00 or the path alias the account picked.
  if (isAnyOf(prefix, 'photos') && userId && !isAnyOf(userId, 'tags')) {
    if (!section) {
      return { kind: 'photostream', userId }
    }

    if (isAnyOf(section, 'favorites')) {
      return { kind: 'favorites', userId }
    }

    if (isAnyOf(section, 'albums') && rest.length === 0) {
      return { kind: 'albums', userId }
    }

    if (isAnyOf(section, 'galleries') && rest.length === 0) {
      return { kind: 'galleries', userId }
    }

    return { kind: 'subpage', userId }
  }

  const groupMatch = pathname.match(groupRegex)

  if (groupMatch?.[1] && nsidRegex.test(groupMatch[1])) {
    return { kind: 'group', group: groupMatch[1], section: getAnyOf(groupMatch[2], groupSections) }
  }
}

export const flickrHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
      return false
    }

    if (forumRegex.test(parsedUrl.pathname)) {
      return true
    }

    const parsed = parseFlickrUrl(url)

    if (!parsed) {
      return false
    }

    if (parsed.kind === 'tag') {
      return true
    }

    if (parsed.kind === 'group') {
      return true
    }

    return nsidRegex.test(parsed.userId)
  },

  resolve: (url) => {
    const parsed = parseFlickrUrl(url)

    // Tag page: /photos/tags/{tag}
    if (parsed?.kind === 'tag') {
      return [
        {
          uri: `${feedsBase}/photos_public.gne?tags=${parsed.tag}`,
          hint: composeHint('flickr:tag'),
        },
      ]
    }

    // Group pool or discussion: /groups/{nsid}, /groups/{nsid}/pool, /groups/{nsid}/discuss
    if (parsed?.kind === 'group') {
      const { group: nsid, section } = parsed
      const pool = {
        uri: `${feedsBase}/groups_pool.gne?id=${nsid}`,
        hint: composeHint('flickr:group-pool'),
      }
      const discuss = {
        uri: `${feedsBase}/groups_discuss.gne?id=${nsid}`,
        hint: composeHint('flickr:group-discuss'),
      }
      // The pool photos that carry a location.
      const geo = {
        uri: `${feedsBase}/geo/?g=${nsid}`,
        hint: composeHint('flickr:group-geo'),
      }

      if (section === 'discuss') {
        return [discuss]
      }

      if (section === 'pool') {
        return [pool, geo]
      }

      return [pool, discuss, geo]
    }

    // Help forum, /help/forum/{locale}, and any other page.
    if (!parsed) {
      return [{ uri: `${feedsBase}/forums.gne`, hint: composeHint('flickr:forum') }]
    }

    // The feeds take only the NSID and answer 404 for a path alias.
    if (!nsidRegex.test(parsed.userId)) {
      return []
    }

    if (parsed.kind === 'favorites') {
      return [
        {
          uri: `${feedsBase}/photos_faves.gne?id=${parsed.userId}`,
          hint: composeHint('flickr:faves'),
        },
      ]
    }

    return [
      {
        uri: `${feedsBase}/photos_public.gne?id=${parsed.userId}`,
        hint: composeHint('flickr:photos'),
      },
    ]
  },
}
