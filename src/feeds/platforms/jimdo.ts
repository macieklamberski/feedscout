import { jimdo } from 'feedintel'
import { getQueryParam, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const feeds = withHintLabels(jimdo.feeds)

// Jimdo Creator answers every page with the site's id in this header, on its own hosts and on
// custom domains alike.
export const isJimdoHeaders = (headers: Headers): boolean => {
  return headers.has('x-jimdo-wid')
}

export const jimdoHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isJimdoHeaders })
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    const tag = getQueryParam(parseUrl(url), 'tag')

    if (tag) {
      return [page.getFeedEntry('blog'), page.getFeedEntry('blog-tag', { tag })]
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
