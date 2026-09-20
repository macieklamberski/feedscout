import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Flickr serves its feeds from `/services/feeds/`, keyed by an NSID such as
// `24662369@N07`. Photostream, favorites and group pages link theirs from
// `<link rel="alternate">`; tag pages and the help forum link nothing. Only
// a URL already carrying an NSID resolves without the page, because
// `photos_public.gne?id={alias}` answers with a 404 page.
//
// `match` therefore tests the feed-bearing paths rather than the host alone.
// A vanity alias such as `/photos/thomashawk` is the common shape and yields
// no feed, so claiming it would shadow the page-linked feed for nothing.

const hosts = ['flickr.com', 'www.flickr.com']
const feedsBase = 'https://www.flickr.com/services/feeds'

const tagRegex = /^\/photos\/tags\/([^/]+)/
const photosRegex = /^\/photos\/(\d+@N\d+)(?:\/(favorites))?/
const groupRegex = /^\/groups\/(\d+@N\d+)(?:\/(pool|discuss))?/
const forumRegex = /^\/help\/forum/
const feedPathRegexes = [tagRegex, photosRegex, groupRegex, forumRegex]

export const flickrHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    const { pathname } = new URL(url)

    return feedPathRegexes.some((regex) => regex.test(pathname))
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Tag page: /photos/tags/{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      return [
        {
          uri: `${feedsBase}/photos_public.gne?tags=${tagMatch[1]}`,
          hint: composeHint('flickr:tag'),
        },
      ]
    }

    // Photostream or favorites: /photos/{nsid}, /photos/{nsid}/favorites
    const photosMatch = pathname.match(photosRegex)

    if (photosMatch?.[1]) {
      const [, nsid, section] = photosMatch

      if (section === 'favorites') {
        return [
          {
            uri: `${feedsBase}/photos_faves.gne?id=${nsid}`,
            hint: composeHint('flickr:faves'),
          },
        ]
      }

      return [
        {
          uri: `${feedsBase}/photos_public.gne?id=${nsid}`,
          hint: composeHint('flickr:photos'),
        },
      ]
    }

    // Group pool or discussion: /groups/{nsid}, /groups/{nsid}/pool, /groups/{nsid}/discuss
    const groupMatch = pathname.match(groupRegex)

    if (groupMatch?.[1]) {
      const [, nsid, section] = groupMatch
      const pool = {
        uri: `${feedsBase}/groups_pool.gne?id=${nsid}`,
        hint: composeHint('flickr:group-pool'),
      }
      const discuss = {
        uri: `${feedsBase}/groups_discuss.gne?id=${nsid}`,
        hint: composeHint('flickr:group-discuss'),
      }

      if (section === 'discuss') {
        return [discuss]
      }

      if (section === 'pool') {
        return [pool]
      }

      return [pool, discuss]
    }

    // Help forum: /help/forum/{locale}
    if (forumRegex.test(pathname)) {
      return [{ uri: `${feedsBase}/forums.gne`, hint: composeHint('flickr:forum') }]
    }

    return []
  },
}
