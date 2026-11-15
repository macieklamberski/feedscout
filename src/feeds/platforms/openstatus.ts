import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMetaContent, isRootOfPage } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

// stpg.dev is OpenStatus's short domain, and serves every status page under the same slug.
const domains = ['openstatus.dev', 'stpg.dev']

const previewImageUrl = 'https://www.openstatus.dev/api/og/page'

const summaryHrefRegex = /^(?:https?:\/\/[^/]+)?\/api\/status\/summary\.json$/i

// A status page is known by its markup, so its feeds are built on any origin, and claimed only on
// a tenant of OpenStatus's own domains, since a custom domain does not name the platform.
const feeds = definePlatformFeeds(
  [
    { key: 'openstatus:updates', template: '{root}/feed/rss', format: 'rss' },
    { key: 'openstatus:updates', template: '{root}/feed/atom', format: 'atom' },
  ],
  { domains },
)

// A status page links its summary endpoint and takes its preview image from the hosted service.
export const isOpenstatusPage = (url: string, content: string | undefined): boolean => {
  if (!content) {
    return false
  }

  if (hasMetaContent(content, 'og:image', previewImageUrl)) {
    return true
  }

  const summaryLink = findElement(content, (element) => {
    return element.name === 'link' && summaryHrefRegex.test(element.attribs.href ?? '')
  })
  const summaryUrl = summaryLink?.attribs.href ? parseUrl(summaryLink.attribs.href, url) : undefined

  if (!summaryUrl) {
    return false
  }

  return isRootOfPage(summaryUrl.origin, url)
}

export const openstatusHandler: PlatformHandler = {
  match: (url, content) => {
    return isOpenstatusPage(url, content)
  },

  resolve: (url) => {
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    return [
      pageFeeds.getFeedEntry('openstatus:updates', {}, 'rss'),
      pageFeeds.getFeedEntry('openstatus:updates', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
