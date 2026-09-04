import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Every `{user}.weblog.lol` blog serves three canonical feeds — `/rss.xml`,
// `/atom.xml`, and `/feed.json` (JSON Feed) — and the homepage HTML emits
// exactly those three as `<link rel="alternate">` tags. The handler short-
// circuits that lookup by emitting all three feeds directly from the
// subdomain; custom-domain weblog.lol blogs (which 302 elsewhere) are out of
// scope for URL-only discovery.

export const weblogLolHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'weblog.lol')
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/rss.xml`, hint: composeHint('weblog-lol:posts-rss') })
    uris.push({ uri: `${origin}/atom.xml`, hint: composeHint('weblog-lol:posts-atom') })
    uris.push({ uri: `${origin}/feed.json`, hint: composeHint('weblog-lol:posts-json') })

    return uris
  },
}
