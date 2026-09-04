import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Seesaa blogs at `{user}.seesaa.net` expose two posts feeds —
// `/index20.rdf` (RSS 2.0) and `/index.rdf` (RSS 1.0/RDF) — but the blog
// HTML only autodiscovers the RDF variant via
// `<link rel="alternate" type="application/rss+xml">`. The handler emits
// both feeds so RSS 2.0 consumers get the richer payload without having to
// scrape the blog body for the alternate URL.

export const seesaaHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'seesaa.net')
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/index20.rdf`, hint: composeHint('seesaa:posts-rss2') })
    uris.push({ uri: `${origin}/index.rdf`, hint: composeHint('seesaa:posts-rdf') })

    return uris
  },
}
