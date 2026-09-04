import { isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Each Bear Blog (a `*.bearblog.dev` subdomain) exposes per-blog Atom at
// `/feed/`, RSS at `/feed/?type=rss`, and tag-filtered variants via
// `/feed/?q={tag}`; the apex `bearblog.dev` also serves the sitewide trending
// feed at `/discover/feed/`. The per-blog Atom URL is advertised on the blog
// homepage via `<link rel="alternate">`, but the RSS, tag, and discover
// variants are not autodiscovered.
// The handler emits both Atom and RSS for posts/tags and adds the apex
// trending feeds that are otherwise undiscoverable.

const apexHosts = ['bearblog.dev', 'www.bearblog.dev']

export const bearblogHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'bearblog.dev') || isHostOf(url, apexHosts)
  },

  resolve: (url) => {
    const { origin, searchParams } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Apex bearblog.dev exposes the platform-wide trending discovery feed.
    if (isHostOf(url, apexHosts)) {
      uris.push({
        uri: 'https://bearblog.dev/discover/feed/',
        hint: composeHint('bearblog:discover-atom'),
      })
      uris.push({
        uri: 'https://bearblog.dev/discover/feed/?type=rss',
        hint: composeHint('bearblog:discover-rss'),
      })

      return uris
    }

    // Tag filter via ?q= query param.
    const tag = searchParams.get('q')

    if (tag) {
      uris.push({
        uri: `${origin}/feed/?q=${encodeURIComponent(tag)}`,
        hint: composeHint('bearblog:tag-atom'),
      })
      uris.push({
        uri: `${origin}/feed/?type=rss&q=${encodeURIComponent(tag)}`,
        hint: composeHint('bearblog:tag-rss'),
      })
    }

    uris.push({ uri: `${origin}/feed/`, hint: composeHint('bearblog:posts-atom') })
    uris.push({ uri: `${origin}/feed/?type=rss`, hint: composeHint('bearblog:posts-rss') })

    return uris
  },
}
