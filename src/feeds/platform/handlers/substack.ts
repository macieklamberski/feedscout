import type { PlatformHandler } from '../../../common/uris/platform/types.js'

export const substackHandler: PlatformHandler = {
  match: (url) => {
    return new URL(url).hostname.toLowerCase().endsWith('.substack.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [`${origin}/feed`]
  },
}
