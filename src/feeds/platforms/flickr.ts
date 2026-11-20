import { flickr } from 'feedintel'
import { decodeSegment, getAnyOf, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: faves, group-discuss, group-geo, group-pool, photos.
// Handler needed for: forum, group-photos, recent, recent-geo, tag.

export type FlickrUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'photostream'; userId: string }
  | { kind: 'favorites'; userId: string }
  | { kind: 'albums'; userId: string }
  | { kind: 'galleries'; userId: string }
  | { kind: 'album'; userId: string; set: string }
  | { kind: 'userTag'; userId: string; tag: string }
  | { kind: 'subpage'; userId: string }
  | { kind: 'group'; group: string; section?: string }
  | { kind: 'forum' }

const hosts = flickr.hosts.exact

const tagRegex = /^\/photos\/tags\/([^/]+)/i
const groupRegex = /^\/groups\/([^/]+)(?:\/([^/]+))?/i
const forumRegex = /^\/help\/forum(?:\/|$)/i
const nsidRegex = /^\d+@N\d+$/

const groupSections = ['pool', 'discuss']
const albumSections = ['albums', 'sets']

const feeds = withHintLabels(flickr.feeds)

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

    // An album, as /albums/{set} and its legacy /sets/{set}.
    if (isAnyOf(section, albumSections) && rest[0]) {
      return { kind: 'album', userId, set: rest[0] }
    }

    if (isAnyOf(section, 'tags') && rest[0]) {
      return { kind: 'userTag', userId, tag: rest[0] }
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

    if (!parsed) {
      return []
    }

    // The forum and the uploads from everyone, with or without a location, need no value from the
    // page, so every page builds them after its own feeds. Each feed comes in Atom and then in RSS.
    if (parsed.kind === 'forum') {
      return [
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    // Tag page: /photos/tags/{tag}
    if (parsed.kind === 'tag') {
      const tags = decodeSegment(parsed.tag) ?? parsed.tag

      return [
        feeds.getFeedEntry('tag', { tags }, 'atom'),
        feeds.getFeedEntry('tag', { tags }, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    // Group pool or discussion: /groups/{nsid}, /groups/{nsid}/pool, /groups/{nsid}/discuss
    if (parsed.kind === 'group') {
      const params = { id: parsed.group }

      if (parsed.section === 'discuss') {
        return [
          feeds.getFeedEntry('group-discuss', params, 'atom'),
          feeds.getFeedEntry('group-discuss', params, 'rss'),
          feeds.getFeedEntry('forum', {}, 'atom'),
          feeds.getFeedEntry('forum', {}, 'rss'),
          feeds.getFeedEntry('recent', {}, 'atom'),
          feeds.getFeedEntry('recent', {}, 'rss'),
          feeds.getFeedEntry('recent-geo', {}, 'atom'),
          feeds.getFeedEntry('recent-geo', {}, 'rss'),
        ]
      }

      if (parsed.section === 'pool') {
        return [
          feeds.getFeedEntry('group-pool', params, 'atom'),
          feeds.getFeedEntry('group-pool', params, 'rss'),
          feeds.getFeedEntry('group-photos', params, 'atom'),
          feeds.getFeedEntry('group-photos', params, 'rss'),
          feeds.getFeedEntry('group-geo', params, 'atom'),
          feeds.getFeedEntry('group-geo', params, 'rss'),
          feeds.getFeedEntry('forum', {}, 'atom'),
          feeds.getFeedEntry('forum', {}, 'rss'),
          feeds.getFeedEntry('recent', {}, 'atom'),
          feeds.getFeedEntry('recent', {}, 'rss'),
          feeds.getFeedEntry('recent-geo', {}, 'atom'),
          feeds.getFeedEntry('recent-geo', {}, 'rss'),
        ]
      }

      return [
        feeds.getFeedEntry('group-pool', params, 'atom'),
        feeds.getFeedEntry('group-pool', params, 'rss'),
        feeds.getFeedEntry('group-photos', params, 'atom'),
        feeds.getFeedEntry('group-photos', params, 'rss'),
        feeds.getFeedEntry('group-discuss', params, 'atom'),
        feeds.getFeedEntry('group-discuss', params, 'rss'),
        feeds.getFeedEntry('group-geo', params, 'atom'),
        feeds.getFeedEntry('group-geo', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    if (!nsidRegex.test(parsed.userId)) {
      return []
    }

    const params = { id: parsed.userId }

    if (parsed.kind === 'album') {
      return [
        feeds.getFeedEntry('photoset', { ...params, set: parsed.set }, 'atom'),
        feeds.getFeedEntry('photoset', { ...params, set: parsed.set }, 'rss'),
        feeds.getFeedEntry('photos', params, 'atom'),
        feeds.getFeedEntry('photos', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    if (parsed.kind === 'userTag') {
      const tags = decodeSegment(parsed.tag) ?? parsed.tag

      return [
        feeds.getFeedEntry('photos-tag', { ...params, tags }, 'atom'),
        feeds.getFeedEntry('photos-tag', { ...params, tags }, 'rss'),
        feeds.getFeedEntry('photos', params, 'atom'),
        feeds.getFeedEntry('photos', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    if (parsed.kind === 'favorites') {
      return [
        feeds.getFeedEntry('faves', params, 'atom'),
        feeds.getFeedEntry('faves', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    return [
      feeds.getFeedEntry('photos', params, 'atom'),
      feeds.getFeedEntry('photos', params, 'rss'),
      feeds.getFeedEntry('forum', {}, 'atom'),
      feeds.getFeedEntry('forum', {}, 'rss'),
      feeds.getFeedEntry('recent', {}, 'atom'),
      feeds.getFeedEntry('recent', {}, 'rss'),
      feeds.getFeedEntry('recent-geo', {}, 'atom'),
      feeds.getFeedEntry('recent-geo', {}, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
