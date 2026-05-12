import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Tistory blogs expose exactly one RSS 2.0 feed per blog at
// `{blog}.tistory.com/rss` (with `/feed` and `/index.xml` as byte-identical
// aliases); per-category, per-tag, Atom, and comment variants all 404. The
// default Tistory theme emits no `<link rel="alternate">` autodiscovery in
// `<head>`, so the handler is required to map any `*.tistory.com` URL onto
// `/rss`.

export const tistoryHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'tistory.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('tistory:blog') }]
  },
}
