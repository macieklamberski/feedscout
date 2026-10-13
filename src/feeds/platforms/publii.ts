import { parseUrl, stripWww } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Publii links its media by absolute URL under the site root, as in
// `https://example.com/blog/media/posts/12/cover.jpg`.
const mediaUrlRegex = /["'](?<siteUrl>https?:\/\/[^"'\s]+?)\/media\/(?:website\/|posts\/\d+\/)/

const hasGenerator = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Publii')
}

export const isPubliiHtml = (content: string): boolean => {
  return hasGenerator(content) || mediaUrlRegex.test(content)
}

// A media link names the site root only when the page sits under it. One on another host is a CDN
// or an image of another site.
const getSiteUrl = (url: string, content: string | undefined): string | undefined => {
  const siteUrl = content?.match(mediaUrlRegex)?.groups?.siteUrl
  const parsedSiteUrl = parseUrl(siteUrl ?? '')
  const parsedUrl = parseUrl(url)

  if (!siteUrl || !parsedSiteUrl || !parsedUrl) {
    return
  }

  if (stripWww(parsedSiteUrl.hostname) !== stripWww(parsedUrl.hostname)) {
    return
  }

  if (!`${parsedUrl.pathname}/`.startsWith(`${parsedSiteUrl.pathname}/`)) {
    return
  }

  return siteUrl
}

export const publiiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!content || !hasMarker(content, headers, { html: isPubliiHtml })) {
      return false
    }

    return hasGenerator(content) || getSiteUrl(url, content) !== undefined
  },

  resolve: (url, content) => {
    const siteUrl = getSiteUrl(url, content) ?? new URL(url).origin

    return [
      { uri: `${siteUrl}/feed.xml`, hint: composeHint('publii:posts', 'atom') },
      { uri: `${siteUrl}/feed.json`, hint: composeHint('publii:posts', 'json') },
    ]
  },
}
