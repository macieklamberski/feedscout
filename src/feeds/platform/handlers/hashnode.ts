import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Hashnode exposes one RSS 2.0 feed per blog at `${origin}/rss.xml` for both
// `*.hashnode.dev` user blogs and first-party `*.hashnode.com` publications
// (Town Hall, Engineering); each blog's HTML head advertises the same URL
// via `<link rel="alternate" type="application/rss+xml">`. No Atom, JSON
// Feed, tag-scoped, or series-scoped variants exist, and there is no
// sitewide feed on `hashnode.com`.

export const hashnodeHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, ['hashnode.dev', 'hashnode.com'])
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss.xml`, hint: composeHint('hashnode:blog') }]
  },
}
