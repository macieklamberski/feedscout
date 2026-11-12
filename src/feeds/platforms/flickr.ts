import {
  decodeSegment,
  getAnyOf,
  getPathSegments,
  getQueryParam,
  isAnyOf,
  isHostOf,
  parseUrl,
} from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers favorites, groupDiscuss, photostream (html), partly covers group, groupPool.
// Handler needed for: helpForum, tag.

export type FlickrUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'photostream'; userId: string }
  | { kind: 'favorites'; userId: string }
  | { kind: 'albums'; userId: string }
  | { kind: 'galleries'; userId: string }
  | { kind: 'subpage'; userId: string }
  | { kind: 'group'; group: string; section?: string }
  | { kind: 'forum' }

const hosts = ['flickr.com', 'www.flickr.com']
// The API host serves every feed the www host serves.
const feedHosts = [...hosts, 'api.flickr.com']

const tagRegex = /^\/photos\/tags\/([^/]+)/i
const groupRegex = /^\/groups\/([^/]+)(?:\/([^/]+))?/i
const forumRegex = /^\/help\/forum(?:\/|$)/i
const nsidRegex = /^\d+@N\d+$/

const groupSections = ['pool', 'discuss']
const feeds = definePlatformFeeds(
  [
    { key: 'flickr:forum', template: 'https://{host}/services/feeds/forums.gne' },
    { key: 'flickr:tag', template: 'https://{host}/services/feeds/photos_public.gne?tags={tags}' },
    { key: 'flickr:photos', template: 'https://{host}/services/feeds/photos_public.gne?id={id}' },
    { key: 'flickr:faves', template: 'https://{host}/services/feeds/photos_faves.gne?id={id}' },
    { key: 'flickr:faves', template: 'https://{host}/services/feeds/photos_faves.gne?nsid={id}' },
    { key: 'flickr:group-pool', template: 'https://{host}/services/feeds/groups_pool.gne?id={id}' },
    {
      key: 'flickr:group-discuss',
      template: 'https://{host}/services/feeds/groups_discuss.gne?id={id}',
    },
    // The pool photos that carry a location.
    { key: 'flickr:group-geo', template: 'https://{host}/services/feeds/geo/?g={id}' },
  ],
  { hosts: feedHosts },
)

export const parseFlickrUrl = (url: string): FlickrUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl

  // Help forum: /help/forum/{locale}.
  if (forumRegex.test(pathname)) {
    return { kind: 'forum' }
  }

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
    const parsed = parseFlickrUrl(url)

    if (!parsed) {
      return false
    }

    // The feeds take only the NSID and answer 404 for a path alias.
    if ('userId' in parsed) {
      return nsidRegex.test(parsed.userId)
    }

    return true
  },

  resolve: (url) => {
    const parsed = parseFlickrUrl(url)
    const host = 'www.flickr.com'

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'forum') {
      return [feeds.getFeedEntry('flickr:forum', { host })]
    }

    // Tag page: /photos/tags/{tag}
    if (parsed.kind === 'tag') {
      const tags = decodeSegment(parsed.tag) ?? parsed.tag

      return [feeds.getFeedEntry('flickr:tag', { host, tags })]
    }

    // Group pool or discussion: /groups/{nsid}, /groups/{nsid}/pool, /groups/{nsid}/discuss
    if (parsed.kind === 'group') {
      const params = { host, id: parsed.group }
      const pool = feeds.getFeedEntry('flickr:group-pool', params)
      const discuss = feeds.getFeedEntry('flickr:group-discuss', params)
      const geo = feeds.getFeedEntry('flickr:group-geo', params)

      if (parsed.section === 'discuss') {
        return [discuss]
      }

      if (parsed.section === 'pool') {
        return [pool, geo]
      }

      return [pool, discuss, geo]
    }

    if (!nsidRegex.test(parsed.userId)) {
      return []
    }

    const params = { host, id: parsed.userId }

    if (parsed.kind === 'favorites') {
      return [feeds.getFeedEntry('flickr:faves', params)]
    }

    return [feeds.getFeedEntry('flickr:photos', params)]
  },

  getFeedKey: (url) => {
    const parsedUrl = parseUrl(url)
    const key = feeds.getFeedKey(url)

    // Flickr ignores `tags` on a group pool or favorites feed, so the feed stays the same.
    if (isAnyOf(key, ['flickr:group-pool', 'flickr:faves'])) {
      return key
    }

    // Flickr narrows a photostream or a group location feed to one tag when `tags` sits beside a
    // non-empty `id` or `g`, a feed resolve never builds. An empty `id=` leaves the tag feed.
    if (
      getQueryParam(parsedUrl, 'tags') &&
      (getQueryParam(parsedUrl, 'id') || getQueryParam(parsedUrl, 'g'))
    ) {
      return
    }

    return key
  },
}
