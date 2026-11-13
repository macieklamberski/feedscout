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
// The API host serves every feed the www host serves. Every feed is Atom by default and RSS 2.0
// under `format=rss_200`.
const feedHosts = [...hosts, 'api.flickr.com']

const tagRegex = /^\/photos\/tags\/([^/]+)/i
const groupRegex = /^\/groups\/([^/]+)(?:\/([^/]+))?/i
const forumRegex = /^\/help\/forum(?:\/|$)/i
const nsidRegex = /^\d+@N\d+$/

const groupSections = ['pool', 'discuss']
const feeds = definePlatformFeeds(
  [
    { key: 'flickr:forum', template: '{scheme}://{host}/services/feeds/forums.gne' },
    {
      key: 'flickr:forum',
      template: '{scheme}://{host}/services/feeds/forums.gne?format=rss_200',
      format: 'rss',
    },
    { key: 'flickr:recent', template: '{scheme}://{host}/services/feeds/photos_public.gne' },
    {
      key: 'flickr:recent',
      template: '{scheme}://{host}/services/feeds/photos_public.gne?format=rss_200',
      format: 'rss',
    },
    { key: 'flickr:recent-geo', template: '{scheme}://{host}/services/feeds/geo' },
    {
      key: 'flickr:recent-geo',
      template: '{scheme}://{host}/services/feeds/geo?format=rss_200',
      format: 'rss',
    },
    {
      key: 'flickr:tag',
      template: '{scheme}://{host}/services/feeds/photos_public.gne?tags={tags}',
    },
    {
      key: 'flickr:tag',
      template: '{scheme}://{host}/services/feeds/photos_public.gne?tags={tags}&format=rss_200',
      format: 'rss',
    },
    {
      key: 'flickr:photos',
      template: '{scheme}://{host}/services/feeds/photos_public.gne?id={id}',
    },
    {
      key: 'flickr:photos',
      template: '{scheme}://{host}/services/feeds/photos_public.gne?id={id}&format=rss_200',
      format: 'rss',
    },
    { key: 'flickr:faves', template: '{scheme}://{host}/services/feeds/photos_faves.gne?id={id}' },
    {
      key: 'flickr:faves',
      template: '{scheme}://{host}/services/feeds/photos_faves.gne?id={id}&format=rss_200',
      format: 'rss',
    },
    {
      key: 'flickr:faves',
      template: '{scheme}://{host}/services/feeds/photos_faves.gne?nsid={id}',
    },
    {
      key: 'flickr:faves',
      template: '{scheme}://{host}/services/feeds/photos_faves.gne?nsid={id}&format=rss_200',
      format: 'rss',
    },
    {
      key: 'flickr:group-pool',
      template: '{scheme}://{host}/services/feeds/groups_pool.gne?id={id}',
    },
    {
      key: 'flickr:group-pool',
      template: '{scheme}://{host}/services/feeds/groups_pool.gne?id={id}&format=rss_200',
      format: 'rss',
    },
    {
      key: 'flickr:group-discuss',
      template: '{scheme}://{host}/services/feeds/groups_discuss.gne?id={id}',
    },
    {
      key: 'flickr:group-discuss',
      template: '{scheme}://{host}/services/feeds/groups_discuss.gne?id={id}&format=rss_200',
      format: 'rss',
    },
    // The pool photos that carry a location.
    { key: 'flickr:group-geo', template: '{scheme}://{host}/services/feeds/geo/?g={id}' },
    {
      key: 'flickr:group-geo',
      template: '{scheme}://{host}/services/feeds/geo/?g={id}&format=rss_200',
      format: 'rss',
    },
    // Past here the table only claims: a photostream narrowed to a tag, an album, the photos of a
    // member's contacts, and the photos that carry a location by member or by tag.
    {
      key: 'flickr:photos-tag',
      template: '{scheme}://{host}/services/feeds/photos_public.gne?id={id}&tags={tags}',
    },
    {
      key: 'flickr:photos-tag',
      template:
        '{scheme}://{host}/services/feeds/photos_public.gne?id={id}&tags={tags}&format=rss_200',
      format: 'rss',
    },
    {
      key: 'flickr:photoset',
      template: '{scheme}://{host}/services/feeds/photoset.gne?nsid={id}&set={set}',
    },
    {
      key: 'flickr:photoset',
      template: '{scheme}://{host}/services/feeds/photoset.gne?nsid={id}&set={set}&format=rss_200',
      format: 'rss',
    },
    {
      key: 'flickr:contacts',
      template: '{scheme}://{host}/services/feeds/photos_friends.gne?user_id={id}',
    },
    {
      key: 'flickr:contacts',
      template: '{scheme}://{host}/services/feeds/photos_friends.gne?user_id={id}&format=rss_200',
      format: 'rss',
    },
    { key: 'flickr:photos-geo', template: '{scheme}://{host}/services/feeds/geo?id={id}' },
    {
      key: 'flickr:photos-geo',
      template: '{scheme}://{host}/services/feeds/geo?id={id}&format=rss_200',
      format: 'rss',
    },
    { key: 'flickr:tag-geo', template: '{scheme}://{host}/services/feeds/geo?tags={tags}' },
    {
      key: 'flickr:tag-geo',
      template: '{scheme}://{host}/services/feeds/geo?tags={tags}&format=rss_200',
      format: 'rss',
    },
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
    const page = feeds.forUrl(url)
    const host = 'www.flickr.com'

    if (!parsed || !page) {
      return []
    }

    // The forum and the uploads from everyone, with or without a location, need no value from the
    // page, so every page builds them after its own feeds.
    if (parsed.kind === 'forum') {
      return [
        page.getFeedEntry('flickr:forum', { host }),
        page.getFeedEntry('flickr:recent', { host }),
        page.getFeedEntry('flickr:recent-geo', { host }),
      ]
    }

    // Tag page: /photos/tags/{tag}
    if (parsed.kind === 'tag') {
      const tags = decodeSegment(parsed.tag) ?? parsed.tag

      return [
        page.getFeedEntry('flickr:tag', { host, tags }),
        page.getFeedEntry('flickr:forum', { host }),
        page.getFeedEntry('flickr:recent', { host }),
        page.getFeedEntry('flickr:recent-geo', { host }),
      ]
    }

    // Group pool or discussion: /groups/{nsid}, /groups/{nsid}/pool, /groups/{nsid}/discuss
    if (parsed.kind === 'group') {
      const params = { host, id: parsed.group }

      if (parsed.section === 'discuss') {
        return [
          page.getFeedEntry('flickr:group-discuss', params),
          page.getFeedEntry('flickr:forum', { host }),
          page.getFeedEntry('flickr:recent', { host }),
          page.getFeedEntry('flickr:recent-geo', { host }),
        ]
      }

      if (parsed.section === 'pool') {
        return [
          page.getFeedEntry('flickr:group-pool', params),
          page.getFeedEntry('flickr:group-geo', params),
          page.getFeedEntry('flickr:forum', { host }),
          page.getFeedEntry('flickr:recent', { host }),
          page.getFeedEntry('flickr:recent-geo', { host }),
        ]
      }

      return [
        page.getFeedEntry('flickr:group-pool', params),
        page.getFeedEntry('flickr:group-discuss', params),
        page.getFeedEntry('flickr:group-geo', params),
        page.getFeedEntry('flickr:forum', { host }),
        page.getFeedEntry('flickr:recent', { host }),
        page.getFeedEntry('flickr:recent-geo', { host }),
      ]
    }

    if (!nsidRegex.test(parsed.userId)) {
      return []
    }

    const params = { host, id: parsed.userId }

    if (parsed.kind === 'favorites') {
      return [
        page.getFeedEntry('flickr:faves', params),
        page.getFeedEntry('flickr:forum', { host }),
        page.getFeedEntry('flickr:recent', { host }),
        page.getFeedEntry('flickr:recent-geo', { host }),
      ]
    }

    return [
      page.getFeedEntry('flickr:photos', params),
      page.getFeedEntry('flickr:forum', { host }),
      page.getFeedEntry('flickr:recent', { host }),
      page.getFeedEntry('flickr:recent-geo', { host }),
    ]
  },

  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)
    const hint = feeds.getFeedHint(url)

    // Flickr ignores `tags` on a group pool or favorites feed, so the feed stays the same.
    if (isAnyOf(hint?.key, ['flickr:group-pool', 'flickr:faves'])) {
      return hint
    }

    if (hint?.key === 'flickr:photos-tag') {
      return hint
    }

    // Flickr narrows a location feed to one tag when `tags` sits beside a non-empty `id` or `g`, a
    // feed no row names. An empty `id=` leaves the tag feed.
    if (
      getQueryParam(parsedUrl, 'tags') &&
      (getQueryParam(parsedUrl, 'id') || getQueryParam(parsedUrl, 'g'))
    ) {
      return
    }

    return hint
  },
}
