import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Mataroa exposes exactly one RSS 2.0 feed per blog at
// `${subdomain}.mataroa.blog/rss/` (top 100 published posts), the only route
// registered in the upstream `urls.py`. There is no Atom (`/atom/` 404s),
// no JSON Feed, no tag-scoped feed, no comments feed, and no sitewide feed
// on the apex `mataroa.blog`. The handler short-circuits the discovery
// fetch and intentionally excludes the apex host.

export const mataroaHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'mataroa.blog')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss/`, hint: composeHint('mataroa:blog') }]
  },
}
