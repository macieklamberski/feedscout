import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// FluxBB serves its feeds through `extern.php`, which takes the format in a
// query parameter rather than a path.
//
// The two board wrapper ids are matched together, because either one alone is
// a plausible id on an unrelated page.

const boardMarkers = ['id="brdheader"', 'id="brdmain"']

export const isFluxbbHtml = (content: string): boolean => {
  return boardMarkers.every((marker) => content.includes(marker))
}

export const fluxbbHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isFluxbbHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [
        {
          uri: `${origin}/extern.php?action=feed&type=RSS`,
          hint: composeHint('fluxbb:posts-rss'),
        },
        {
          uri: `${origin}/extern.php?action=feed&type=atom`,
          hint: composeHint('fluxbb:posts-atom'),
        },
      ]
    } catch {}

    return []
  },
}
