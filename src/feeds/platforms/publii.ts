import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Publii links its media by absolute URL under the site root, as in
// `https://example.com/blog/media/posts/12/cover.jpg`.
const mediaUrlRegex = /["'](https?:\/\/[^"'\s]+?)\/media\/(?:website|posts)\//

export const isPubliiHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Publii') || mediaUrlRegex.test(content)
}

export const publiiHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isPubliiHtml(content ?? '')
  },

  resolve: (url, content) => {
    const { origin } = new URL(url)
    const siteUrl = content?.match(mediaUrlRegex)?.[1] ?? origin

    return [
      { uri: `${siteUrl}/feed.xml`, hint: composeHint('publii:posts', 'atom') },
      { uri: `${siteUrl}/feed.json`, hint: composeHint('publii:posts', 'json') },
    ]
  },
}
