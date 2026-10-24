import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent, isRootOfPage } from '../../common/utils.js'

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

const getSiteUrl = (url: string, content: string | undefined): string | undefined => {
  const siteUrl = content?.match(mediaUrlRegex)?.groups?.siteUrl

  if (!siteUrl || !isRootOfPage(siteUrl, url)) {
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
