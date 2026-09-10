import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// KuCoin publishes one RSS 2.0 feed, `/rss/news`, carrying the announcements
// channel. No page links it through `<link rel="alternate">` or an HTTP Link
// header, and the path is two segments deep, past the reach of URI guessing.

const hosts = ['kucoin.com', 'www.kucoin.com']

export const kucoinHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  // A HEAD request to the feed returns 404. It answers GET only.
  resolve: () => {
    return [
      {
        uri: 'https://www.kucoin.com/rss/news',
        hint: composeHint('kucoin:news'),
      },
    ]
  },
}
