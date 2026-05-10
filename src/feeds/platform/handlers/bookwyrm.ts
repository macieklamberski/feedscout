import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverable without handler.

const profileRegex = /^\/user\/([^/]+)/
const shelfRegex = /^\/user\/([^/]+)\/(?:shelf|books)\/([^/]+)\/?/

export const isBookwyrmHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'BookWyrm')
}

export const bookwyrmHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isBookwyrmHtml(content)) {
        return false
      }

      const { pathname } = new URL(url)

      return profileRegex.test(pathname)
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const match = pathname.match(profileRegex)

      if (!match?.[1]) {
        return []
      }

      const user = match[1]
      const uris: Array<DiscoverUriEntry> = []

      // Shelf page: /user/{user}/(shelf|books)/{shelf-id} — emit shelf feed first.
      const shelfMatch = pathname.match(shelfRegex)

      if (shelfMatch?.[2]) {
        uris.push({
          uri: `${origin}/user/${user}/${pathname.split('/')[3]}/${shelfMatch[2]}/rss`,
          hint: composeHint('bookwyrm:shelf'),
        })
      }

      uris.push(
        {
          uri: `${origin}/user/${user}/rss`,
          hint: composeHint('bookwyrm:activity'),
        },
        {
          uri: `${origin}/user/${user}/rss-reviews`,
          hint: composeHint('bookwyrm:reviews'),
        },
        {
          uri: `${origin}/user/${user}/rss-quotes`,
          hint: composeHint('bookwyrm:quotes'),
        },
        {
          uri: `${origin}/user/${user}/rss-comments`,
          hint: composeHint('bookwyrm:comments'),
        },
      )

      return uris
    } catch {}

    return []
  },
}
