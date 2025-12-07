import type { PlatformHandler } from '../types.js'

export const substackHandler: PlatformHandler = {
  match: (url) => new URL(url).hostname.toLowerCase().endsWith('.substack.com'),

  resolve: async (url) => {
    const { origin } = new URL(url)

    return [`${origin}/feed`]
  },
}
