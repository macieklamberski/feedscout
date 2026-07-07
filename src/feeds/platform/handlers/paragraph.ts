import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Paragraph serves one RSS feed per user off-domain at
// `api.paragraph.com/blogs/rss/@{user}`. The `paragraph.com/@{user}` profile page
// does not advertise it via HTML `<link rel="alternate" type="application/rss+xml">`
// (only a `text/plain` `llms.txt` alternate is present), and there are no Atom,
// JSON Feed, per-tag, or per-section variants. The handler is needed to translate
// the `@{user}` URL shape onto the canonical `api.paragraph.com` URL (the
// `/@{user}/feed` and `/@{user}/rss` paths exist but 308-redirect to it).

const hosts = ['paragraph.com', 'www.paragraph.com']
const userRegex = /^\/@([^/]+)/

export const paragraphHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(userRegex)

    if (!userMatch?.[1]) {
      return []
    }

    const username = userMatch[1]

    return [
      {
        uri: `https://api.paragraph.com/blogs/rss/@${username}`,
        hint: composeHint('paragraph:blog'),
      },
    ]
  },
}
