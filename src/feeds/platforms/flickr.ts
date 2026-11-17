import { decodeSegment, getAnyOf, getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
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
  | { kind: 'album'; userId: string; set: string }
  | { kind: 'userTag'; userId: string; tag: string }
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
const albumSections = ['albums', 'sets']

const feeds = definePlatformFeeds(
  [
    {
      key: 'flickr:forum',
      main: 'https://www.flickr.com/services/feeds/forums.gne',
      aliases: ['{scheme}://{host}/services/feeds/forums.gne'],
    },
    {
      key: 'flickr:forum',
      main: 'https://www.flickr.com/services/feeds/forums.gne?format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/forums.gne?format=rss_200'],
    },
    {
      key: 'flickr:recent',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne'],
    },
    {
      key: 'flickr:recent',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?format=rss_200'],
    },
    {
      key: 'flickr:recent-geo',
      main: 'https://www.flickr.com/services/feeds/geo',
      aliases: ['{scheme}://{host}/services/feeds/geo'],
    },
    {
      key: 'flickr:recent-geo',
      main: 'https://www.flickr.com/services/feeds/geo?format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/geo?format=rss_200'],
    },
    {
      key: 'flickr:tag',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?tags={tags}',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?tags={tags}'],
    },
    {
      key: 'flickr:tag',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?tags={tags}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?tags={tags}&format=rss_200'],
    },
    {
      key: 'flickr:photos',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?id={id}',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?id={id}'],
    },
    {
      key: 'flickr:photos',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?id={id}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?id={id}&format=rss_200'],
    },
    {
      key: 'flickr:faves',
      main: 'https://www.flickr.com/services/feeds/photos_faves.gne?id={id}',
      aliases: [
        '{scheme}://{host}/services/feeds/photos_faves.gne?id={id}',
        '{scheme}://{host}/services/feeds/photos_faves.gne?nsid={id}',
      ],
    },
    {
      key: 'flickr:faves',
      main: 'https://www.flickr.com/services/feeds/photos_faves.gne?id={id}&format=rss_200',
      format: 'rss',
      aliases: [
        '{scheme}://{host}/services/feeds/photos_faves.gne?id={id}&format=rss_200',
        '{scheme}://{host}/services/feeds/photos_faves.gne?nsid={id}&format=rss_200',
      ],
    },
    {
      key: 'flickr:group-pool',
      main: 'https://www.flickr.com/services/feeds/groups_pool.gne?id={id}',
      aliases: ['{scheme}://{host}/services/feeds/groups_pool.gne?id={id}'],
    },
    {
      key: 'flickr:group-pool',
      main: 'https://www.flickr.com/services/feeds/groups_pool.gne?id={id}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/groups_pool.gne?id={id}&format=rss_200'],
    },
    {
      key: 'flickr:group-discuss',
      main: 'https://www.flickr.com/services/feeds/groups_discuss.gne?id={id}',
      aliases: ['{scheme}://{host}/services/feeds/groups_discuss.gne?id={id}'],
    },
    {
      key: 'flickr:group-discuss',
      main: 'https://www.flickr.com/services/feeds/groups_discuss.gne?id={id}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/groups_discuss.gne?id={id}&format=rss_200'],
    },
    // The pool photos through the uploads feed, which reads `g` as the group.
    {
      key: 'flickr:group-photos',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?g={id}',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?g={id}'],
    },
    {
      key: 'flickr:group-photos',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?g={id}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?g={id}&format=rss_200'],
    },
    // The pool photos that carry a location.
    {
      key: 'flickr:group-geo',
      main: 'https://www.flickr.com/services/feeds/geo/?g={id}',
      aliases: ['{scheme}://{host}/services/feeds/geo/?g={id}'],
    },
    {
      key: 'flickr:group-geo',
      main: 'https://www.flickr.com/services/feeds/geo/?g={id}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/geo/?g={id}&format=rss_200'],
    },
    // Past here the table only claims, but for an album and a photostream narrowed to a tag: the
    // photos of a member's contacts, a group pool narrowed to a tag, and the photos that carry a
    // location by member, by tag, or by member or group pool narrowed to a tag.
    {
      key: 'flickr:photos-tag',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?id={id}&tags={tags}',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?id={id}&tags={tags}'],
    },
    {
      key: 'flickr:photos-tag',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?id={id}&tags={tags}&format=rss_200',
      format: 'rss',
      aliases: [
        '{scheme}://{host}/services/feeds/photos_public.gne?id={id}&tags={tags}&format=rss_200',
      ],
    },
    {
      key: 'flickr:photoset',
      main: 'https://www.flickr.com/services/feeds/photoset.gne?nsid={id}&set={set}',
      aliases: ['{scheme}://{host}/services/feeds/photoset.gne?nsid={id}&set={set}'],
    },
    {
      key: 'flickr:photoset',
      main: 'https://www.flickr.com/services/feeds/photoset.gne?nsid={id}&set={set}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/photoset.gne?nsid={id}&set={set}&format=rss_200'],
    },
    {
      key: 'flickr:contacts',
      main: 'https://www.flickr.com/services/feeds/photos_friends.gne?user_id={id}',
      aliases: ['{scheme}://{host}/services/feeds/photos_friends.gne?user_id={id}'],
    },
    {
      key: 'flickr:contacts',
      main: 'https://www.flickr.com/services/feeds/photos_friends.gne?user_id={id}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/photos_friends.gne?user_id={id}&format=rss_200'],
    },
    {
      key: 'flickr:photos-geo',
      main: 'https://www.flickr.com/services/feeds/geo?id={id}',
      aliases: ['{scheme}://{host}/services/feeds/geo?id={id}'],
    },
    {
      key: 'flickr:photos-geo',
      main: 'https://www.flickr.com/services/feeds/geo?id={id}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/geo?id={id}&format=rss_200'],
    },
    {
      key: 'flickr:tag-geo',
      main: 'https://www.flickr.com/services/feeds/geo?tags={tags}',
      aliases: ['{scheme}://{host}/services/feeds/geo?tags={tags}'],
    },
    {
      key: 'flickr:tag-geo',
      main: 'https://www.flickr.com/services/feeds/geo?tags={tags}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/geo?tags={tags}&format=rss_200'],
    },
    {
      key: 'flickr:group-photos-tag',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?g={id}&tags={tags}',
      aliases: ['{scheme}://{host}/services/feeds/photos_public.gne?g={id}&tags={tags}'],
    },
    {
      key: 'flickr:group-photos-tag',
      main: 'https://www.flickr.com/services/feeds/photos_public.gne?g={id}&tags={tags}&format=rss_200',
      format: 'rss',
      aliases: [
        '{scheme}://{host}/services/feeds/photos_public.gne?g={id}&tags={tags}&format=rss_200',
      ],
    },
    {
      key: 'flickr:photos-tag-geo',
      main: 'https://www.flickr.com/services/feeds/geo?id={id}&tags={tags}',
      aliases: ['{scheme}://{host}/services/feeds/geo?id={id}&tags={tags}'],
    },
    {
      key: 'flickr:photos-tag-geo',
      main: 'https://www.flickr.com/services/feeds/geo?id={id}&tags={tags}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/geo?id={id}&tags={tags}&format=rss_200'],
    },
    {
      key: 'flickr:group-tag-geo',
      main: 'https://www.flickr.com/services/feeds/geo/?g={id}&tags={tags}',
      aliases: ['{scheme}://{host}/services/feeds/geo/?g={id}&tags={tags}'],
    },
    {
      key: 'flickr:group-tag-geo',
      main: 'https://www.flickr.com/services/feeds/geo/?g={id}&tags={tags}&format=rss_200',
      format: 'rss',
      aliases: ['{scheme}://{host}/services/feeds/geo/?g={id}&tags={tags}&format=rss_200'],
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
        feeds.getFeedEntry('flickr:forum'),
        feeds.getFeedEntry('flickr:forum', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent'),
        feeds.getFeedEntry('flickr:recent', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent-geo'),
        feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
      ]
    }

    // Tag page: /photos/tags/{tag}
    if (parsed.kind === 'tag') {
      const tags = decodeSegment(parsed.tag) ?? parsed.tag

      return [
        feeds.getFeedEntry('flickr:tag', { tags }),
        feeds.getFeedEntry('flickr:tag', { tags }, 'rss'),
        feeds.getFeedEntry('flickr:forum'),
        feeds.getFeedEntry('flickr:forum', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent'),
        feeds.getFeedEntry('flickr:recent', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent-geo'),
        feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
      ]
    }

    // Group pool or discussion: /groups/{nsid}, /groups/{nsid}/pool, /groups/{nsid}/discuss
    if (parsed.kind === 'group') {
      const params = { id: parsed.group }

      if (parsed.section === 'discuss') {
        return [
          feeds.getFeedEntry('flickr:group-discuss', params),
          feeds.getFeedEntry('flickr:group-discuss', params, 'rss'),
          feeds.getFeedEntry('flickr:forum'),
          feeds.getFeedEntry('flickr:forum', {}, 'rss'),
          feeds.getFeedEntry('flickr:recent'),
          feeds.getFeedEntry('flickr:recent', {}, 'rss'),
          feeds.getFeedEntry('flickr:recent-geo'),
          feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
        ]
      }

      if (parsed.section === 'pool') {
        return [
          feeds.getFeedEntry('flickr:group-pool', params),
          feeds.getFeedEntry('flickr:group-pool', params, 'rss'),
          feeds.getFeedEntry('flickr:group-photos', params),
          feeds.getFeedEntry('flickr:group-photos', params, 'rss'),
          feeds.getFeedEntry('flickr:group-geo', params),
          feeds.getFeedEntry('flickr:group-geo', params, 'rss'),
          feeds.getFeedEntry('flickr:forum'),
          feeds.getFeedEntry('flickr:forum', {}, 'rss'),
          feeds.getFeedEntry('flickr:recent'),
          feeds.getFeedEntry('flickr:recent', {}, 'rss'),
          feeds.getFeedEntry('flickr:recent-geo'),
          feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
        ]
      }

      return [
        feeds.getFeedEntry('flickr:group-pool', params),
        feeds.getFeedEntry('flickr:group-pool', params, 'rss'),
        feeds.getFeedEntry('flickr:group-photos', params),
        feeds.getFeedEntry('flickr:group-photos', params, 'rss'),
        feeds.getFeedEntry('flickr:group-discuss', params),
        feeds.getFeedEntry('flickr:group-discuss', params, 'rss'),
        feeds.getFeedEntry('flickr:group-geo', params),
        feeds.getFeedEntry('flickr:group-geo', params, 'rss'),
        feeds.getFeedEntry('flickr:forum'),
        feeds.getFeedEntry('flickr:forum', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent'),
        feeds.getFeedEntry('flickr:recent', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent-geo'),
        feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
      ]
    }

    if (!nsidRegex.test(parsed.userId)) {
      return []
    }

    const params = { id: parsed.userId }

    if (parsed.kind === 'album') {
      return [
        feeds.getFeedEntry('flickr:photoset', { ...params, set: parsed.set }),
        feeds.getFeedEntry('flickr:photoset', { ...params, set: parsed.set }, 'rss'),
        feeds.getFeedEntry('flickr:photos', params),
        feeds.getFeedEntry('flickr:photos', params, 'rss'),
        feeds.getFeedEntry('flickr:forum'),
        feeds.getFeedEntry('flickr:forum', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent'),
        feeds.getFeedEntry('flickr:recent', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent-geo'),
        feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
      ]
    }

    if (parsed.kind === 'userTag') {
      const tags = decodeSegment(parsed.tag) ?? parsed.tag

      return [
        feeds.getFeedEntry('flickr:photos-tag', { ...params, tags }),
        feeds.getFeedEntry('flickr:photos-tag', { ...params, tags }, 'rss'),
        feeds.getFeedEntry('flickr:photos', params),
        feeds.getFeedEntry('flickr:photos', params, 'rss'),
        feeds.getFeedEntry('flickr:forum'),
        feeds.getFeedEntry('flickr:forum', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent'),
        feeds.getFeedEntry('flickr:recent', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent-geo'),
        feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
      ]
    }

    if (parsed.kind === 'favorites') {
      return [
        feeds.getFeedEntry('flickr:faves', params),
        feeds.getFeedEntry('flickr:faves', params, 'rss'),
        feeds.getFeedEntry('flickr:forum'),
        feeds.getFeedEntry('flickr:forum', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent'),
        feeds.getFeedEntry('flickr:recent', {}, 'rss'),
        feeds.getFeedEntry('flickr:recent-geo'),
        feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
      ]
    }

    return [
      feeds.getFeedEntry('flickr:photos', params),
      feeds.getFeedEntry('flickr:photos', params, 'rss'),
      feeds.getFeedEntry('flickr:forum'),
      feeds.getFeedEntry('flickr:forum', {}, 'rss'),
      feeds.getFeedEntry('flickr:recent'),
      feeds.getFeedEntry('flickr:recent', {}, 'rss'),
      feeds.getFeedEntry('flickr:recent-geo'),
      feeds.getFeedEntry('flickr:recent-geo', {}, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
