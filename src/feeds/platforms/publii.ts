import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent, isRootOfPage } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Publii links its media by absolute URL under the site root, as in
// `https://example.com/blog/media/posts/12/cover.jpg`.
const mediaUrlRegex = /["'](?<siteUrl>https?:\/\/[^"'\s]+?)\/media\/(?:website\/|posts\/\d+\/)/i

// A site of any domain is known only by its marker, so its feeds are built here but not claimed.
const feeds = definePlatformFeeds([
  { key: 'publii:posts', template: '{root}/feed.xml', format: 'atom' },
  { key: 'publii:posts', template: '{root}/feed.json', format: 'json' },
])

const hasGenerator = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Publii')
}

export const isPubliiHtml = (content: string): boolean => {
  return hasGenerator(content) || mediaUrlRegex.test(content)
}

export type PubliiPage = { kind: 'site'; siteUrl: string }

// A media link names the site root only when the page sits under it. One on another host is a CDN
// or an image of another site.
const getMediaSiteUrl = (url: string, content: string | undefined): string | undefined => {
  const siteUrl = content?.match(mediaUrlRegex)?.groups?.siteUrl

  if (!siteUrl || !isRootOfPage(siteUrl, url)) {
    return
  }

  return siteUrl
}

// Without a media link that holds the page, the generator meta alone puts the site at the origin.
export const getPubliiPage = (url: string, content: string | undefined): PubliiPage | undefined => {
  const siteUrl = getMediaSiteUrl(url, content)

  if (siteUrl) {
    return { kind: 'site', siteUrl }
  }

  if (!content || !hasGenerator(content)) {
    return
  }

  return { kind: 'site', siteUrl: new URL(url).origin }
}

export const publiiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!content || !hasMarker(content, headers, { html: isPubliiHtml })) {
      return false
    }

    return getPubliiPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getPubliiPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [
      pageFeeds.getFeedEntry('publii:posts', { root: page.siteUrl }, 'atom'),
      pageFeeds.getFeedEntry('publii:posts', { root: page.siteUrl }, 'json'),
    ]
  },
}
