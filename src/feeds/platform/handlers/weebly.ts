import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Weebly blogs expose RSS 2.0 at `/{blog-page-slug}/feed` (e.g. `/blog/feed`)
// and at the per-site numeric page ID `/{N}/feed`, but the homepage's
// `<link rel="alternate">` tag is rendered with an empty `href=""` so
// autodiscovery is broken. The handler maps the first path segment onto a
// `/{slug}/feed` URL and adds `/blog/feed` as a default fallback for sites
// that don't include the blog slug in the input URL.

const numericRegex = /^\d+$/

export const weeblyHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'weebly.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)
    const uris: Array<DiscoverUriEntry> = []

    // Custom blog page slug (e.g., /blog/feed when page is named "blog").
    const firstSegment = pathSegments[0]

    if (firstSegment && !numericRegex.test(firstSegment)) {
      uris.push({
        uri: `${origin}/${firstSegment}/feed`,
        hint: composeHint('weebly:blog'),
      })
    }

    uris.push({ uri: `${origin}/blog/feed`, hint: composeHint('weebly:blog') })

    return uris
  },
}
