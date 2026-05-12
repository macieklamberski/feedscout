import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Audioboom channel pages at `audioboom.com/channels/{id}[-{slug}]` map to a
// canonical RSS at `audioboom.com/channels/{id}.rss`, advertised on the
// channel page via standard `<link rel="alternate">` autodiscovery and
// reachable directly by appending `.rss` to the channel path.
// The handler extracts the numeric channel ID (ignoring the optional
// trailing slug) so both `{id}` and `{id}-{slug}` URL forms resolve to the
// same RSS without needing a fetch.

const hosts = ['audioboom.com', 'www.audioboom.com']
const channelRegex = /^\/channels\/(\d+)/

export const audioboomHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(channelRegex)

    if (!match?.[1]) {
      return []
    }

    const channelId = match[1]
    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://audioboom.com/channels/${channelId}.rss`,
      hint: composeHint('audioboom:podcast'),
    })

    return uris
  },
}
