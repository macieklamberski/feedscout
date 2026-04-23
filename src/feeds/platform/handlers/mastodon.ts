import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'
import { isMastodonHeaders, isMastodonHtml } from '../../../favicons/platform/handlers/mastodon.js'

const profileRegex = /^\/@([^/]+)/
const taggedProfileRegex = /^\/@([^/]+)\/tagged\/([^/]+)/
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
    try {
      const { pathname } = new URL(url)

      if (!isProfilePath(pathname) && !isTagPath(pathname)) {
        return false
      }

      if (content && isMastodonHtml(content)) {
        return true
      }

      if (headers && isMastodonHeaders(headers)) {
        return true
      }
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)

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
    } catch {}

    return []
  },
}
