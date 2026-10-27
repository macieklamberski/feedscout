import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { parseBitchuteUrl } from '../../feeds/platforms/bitchute.js'

// The `_large` rendition is 570x556, the `_medium` one is a 400x400 square.
const channelImageRegex =
  /^(?<base>https:\/\/static-\d+\.bitchute\.com\/live\/channel_images\/.+)_large(?<extension>\.\w+)$/

export const bitchuteHandler: PlatformHandler = {
  match: (url) => {
    return parseBitchuteUrl(url) !== undefined
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const { base, extension } =
      getMetaContent(content, 'og:image')?.match(channelImageRegex)?.groups ?? {}

    // An unknown channel serves a generic sharing image outside `channel_images`.
    if (!base || !extension) {
      return []
    }

    return [{ uri: `${base}_medium${extension}` }]
  },
}
