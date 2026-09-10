import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// SMZDM serves its main deals feed from a dedicated host, `feed.smzdm.com`,
// which no page links and no path guess reaches. The category subdomains
// answer at `/feed` and generic discovery already finds those.

const hosts = ['smzdm.com', 'www.smzdm.com']

export const smzdmHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  // The feed host answers over HTTP only. HTTPS returns 403.
  resolve: () => {
    return [{ uri: 'http://feed.smzdm.com', hint: composeHint('smzdm:deals') }]
  },
}
