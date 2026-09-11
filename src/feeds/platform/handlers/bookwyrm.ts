import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// BookWyrm instances expose per-user activity, reviews, quotes, and comments
// feeds at `/user/{user}/{rss,rss-reviews,rss-quotes,rss-comments}`, plus
// per-shelf feeds at `/user/{user}/(shelf|books)/{shelf-id}/rss`. Because
// BookWyrm is self-hosted on arbitrary hostnames, matching relies on the page
// HTML rather than a fixed host list: 64 instances, none of them dominant.
// The handler emits all four per-user feeds plus the shelf feed when the URL
// is a shelf page.
//
// Current BookWyrm serves no generator meta. Measured across the instance
// directory on 2026-09-11: absent on 27 of 27 readable instances, present on
// none. The source link the footer template renders is what identifies the
// software now, and it was present on all 26 that served a real page. The
// generator check stays for any install still emitting it.
//
// An instance that themes its footer away is not matched. Nothing else on the
// page names the software: the theme stylesheet is a build artefact and the
// opensearch title is translated per instance.

const profileRegex = /^\/user\/([^/]+)/
const shelfRegex = /^\/user\/([^/]+)\/(?:shelf|books)\/([^/]+)\/?/
// The trailing boundary keeps sibling repositories such as `bookwyrm-docs` out.
const sourceLinkRegex = /github\.com\/bookwyrm-social\/bookwyrm(?![\w-])/

export const isBookwyrmHtml = (content: string): boolean => {
  return sourceLinkRegex.test(content) || hasMetaContent(content, 'generator', 'BookWyrm')
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
