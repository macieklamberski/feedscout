import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Bluesky's web app exposes exactly one RSS surface per profile at
// `bsky.app/profile/{ident}/rss`, accepting either a DNS-style handle or a
// `did:plc:...` DID. The profile page advertises this feed via standard
// `<link rel="alternate">` autodiscovery, pointing at the DID form.
// The handler emits the handle-based URL which 302-redirects to the canonical
// DID form, sparing a separate handle-to-DID resolution step.

const profileRegex = /^\/profile\/([^/]+)/

const hosts = ['bsky.app', 'www.bsky.app']

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const profileMatch = pathname.match(profileRegex)
    const handle = profileMatch?.[1]

    if (!handle) {
      return []
    }

    return [
      {
        uri: `https://bsky.app/profile/${handle}/rss`,
        hint: composeHint('bluesky:posts'),
      },
    ]
  },
}
