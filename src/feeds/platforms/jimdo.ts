import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['jimdofree.com']

// A site on its own domain is known only by its header, so its feeds are built here but not
// claimed. A blog narrowed to one tag is linked from a post's tag list, which `resolve` does not
// read, so the table only claims it.
const feeds = definePlatformFeeds(
  [
    { key: 'jimdo:blog', template: '{scheme}://{host}/rss/blog' },
    { key: 'jimdo:blog-tag', template: '{scheme}://{host}/rss/blog/{tag}' },
  ],
  { domains },
)

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

    return [page.getFeedEntry('jimdo:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
