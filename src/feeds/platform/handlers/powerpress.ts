import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Blubrry PowerPress is a WordPress plugin that serves a podcast feed at
// `{site}/feed/podcast/`. Generic discovery finds `{site}/feed/`, which is the
// blog feed and not the podcast one, so the podcast feed is what the handler
// adds.
//
// The marker is the named function the plugin writes into the page. The theme
// decides the class names around it, so those identify the theme rather than
// the plugin.

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
