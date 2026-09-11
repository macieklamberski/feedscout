import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// An FC2 blog serves RSS 1.0 at `/?xml` on whichever host answers.
//
// `{user}.blog.fc2.com` redirects to a numbered host such as
// `{user}.blog26.fc2.com`, the old sharding scheme, so both shapes are matched
// and the feed is built from the host in hand rather than from the canonical
// one.

const blogHostRegex = /\.blog\d*\.fc2\.com$/i

export const fc2Handler: PlatformHandler = {
  match: (url) => {
    try {
      return blogHostRegex.test(new URL(url).hostname)
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [{ uri: `${origin}/?xml`, hint: composeHint('fc2:posts') }]
    } catch {}

    return []
  },
}
