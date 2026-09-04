import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Odysee exposes a single RSS surface per channel at
// `odysee.com/$/rss/@{name}:{claimid}` (the claim-ID suffix is mandatory; the
// server returns the cached error `Invalid URL` for the bare `@name` form). The
// channel page itself does not advertise it via HTML `<link rel="alternate">` —
// users have to copy it from the in-UI three-dot menu. No tag, category,
// discover, playlist, or per-claim RSS surfaces exist. The handler is needed to
// recognise the `@name:claimid` path shape and emit the corresponding
// `$/rss/{@name:claimid}` URL.

const hosts = ['odysee.com', 'www.odysee.com']
const channelRegex = /^\/(@[^/:]+:[a-f0-9]+)/i

export const odyseeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(channelRegex)

    if (!match?.[1]) {
      return []
    }

    return [
      {
        uri: `https://odysee.com/$/rss/${match[1]}`,
        hint: composeHint('odysee:videos'),
      },
    ]
  },
}
