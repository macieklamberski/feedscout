import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const playerFunction = 'powerpress_pinw'

export const isPowerpressHtml = (content: string): boolean => {
  return content.includes(playerFunction)
}

export const powerpressHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isPowerpressHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [{ uri: `${origin}/feed/podcast/`, hint: composeHint('powerpress:podcast') }]
    } catch {}

    return []
  },
}
