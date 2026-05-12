import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Pagecord serves one canonical RSS feed per blog at `{slug}.pagecord.com/feed.xml`,
// which the blog page advertises via HTML `<link rel="alternate" type="application/rss+xml">`.
// No Atom or JSON Feed variants exist (`/feed.atom`, `/feed.json`, `/rss`, `/atom`,
// `/tag/{tag}/feed.xml` all 404); the only alternative shape is the undocumented
// `/feed` alias which simply duplicates the canonical URL. The handler emits the
// canonical `/feed.xml` for any `*.pagecord.com` subdomain (excluding `www`),
// avoiding a redundant alias entry and Pagecord's apex marketing redirect.

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'pagecord.com') && !isHostOf(url, 'www.pagecord.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed.xml`, hint: composeHint('pagecord:blog') }]
  },
}
