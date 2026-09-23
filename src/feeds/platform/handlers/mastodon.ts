import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'
import { isMastodonHeaders, isMastodonHtml } from '../../../favicons/platform/handlers/mastodon.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profile (html).
// Handler needed for: tag.

const profileRegex = /^\/@([^/]+)/
const taggedProfileRegex = /^\/@([^/]+)\/tagged\/([^/]+)/
const repliesProfileRegex = /^\/@([^/]+)\/with_replies/
const mediaProfileRegex = /^\/@([^/]+)\/media/
const tagRegex = /^\/tags\/([^/]+)/

export const isProfilePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length > 0 && segments[0].startsWith('@')
}

export const isTagPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'tags'
}

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    if (!isProfilePath(pathname) && !isTagPath(pathname)) {
      return false
    }

    if (content && isMastodonHtml(content)) {
      return true
    }

    if (headers && isMastodonHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl

    // Replies-included feed: /@user/with_replies
    const repliesMatch = pathname.match(repliesProfileRegex)

    if (repliesMatch?.[1]) {
      return [
        {
          uri: `${origin}/@${repliesMatch[1]}/with_replies.rss`,
          hint: composeHint('mastodon:replies'),
        },
        {
          uri: `${origin}/@${repliesMatch[1]}.rss`,
          hint: composeHint('mastodon:posts'),
        },
      ]
    }

    // Media-only feed: /@user/media
    const mediaMatch = pathname.match(mediaProfileRegex)

    if (mediaMatch?.[1]) {
      return [
        {
          uri: `${origin}/@${mediaMatch[1]}/media.rss`,
          hint: composeHint('mastodon:media'),
        },
        {
          uri: `${origin}/@${mediaMatch[1]}.rss`,
          hint: composeHint('mastodon:posts'),
        },
      ]
    }

    // Tagged profile page: /@user/tagged/{tag}
    const taggedMatch = pathname.match(taggedProfileRegex)

    if (taggedMatch?.[1] && taggedMatch?.[2]) {
      const uris: Array<DiscoverUriEntry> = []

      uris.push({
        uri: `${origin}/@${taggedMatch[1]}/tagged/${taggedMatch[2]}.rss`,
        hint: composeHint('mastodon:tagged'),
      })
      uris.push({
        uri: `${origin}/@${taggedMatch[1]}.rss`,
        hint: composeHint('mastodon:posts'),
      })

      return uris
    }

    const userMatch = pathname.match(profileRegex)

    if (userMatch?.[1]) {
      return [{ uri: `${origin}/@${userMatch[1]}.rss`, hint: composeHint('mastodon:posts') }]
    }

    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      return [{ uri: `${origin}/tags/${tagMatch[1]}.rss`, hint: composeHint('mastodon:tag') }]
    }

    return []
  },
}
