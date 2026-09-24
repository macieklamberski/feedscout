import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { hosts } from '../../feeds/platforms/bitchute.js'

const channelPathRegex = /^\/channel\/[^/]+/
// The `_large` rendition is 570x556, the `_medium` one is a 400x400 square.
const channelImageRegex =
  /^(https:\/\/static-\d+\.bitchute\.com\/live\/channel_images\/.+)_large(\.\w+)$/

export const bitchuteHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isHostOf(url, hosts) && channelPathRegex.test(parsedUrl.pathname)
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const match = getMetaContent(content, 'og:image')?.match(channelImageRegex)

    // An unknown channel serves a generic sharing image outside `channel_images`.
    if (!match) {
      return []
    }

    return [{ uri: `${match[1]}_medium${match[2]}` }]
  },
}
