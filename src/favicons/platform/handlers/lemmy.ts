import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import {
  isCommunityPath,
  isLemmyHeaders,
  isLemmyHtml,
} from '../../../feeds/platform/handlers/lemmy.js'

// User pages are left out: an uploaded avatar is not cropped square.
export const lemmyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isCommunityPath(parsedUrl.pathname)) {
      return false
    }

    if (content && isLemmyHtml(content)) {
      return true
    }

    if (headers && isLemmyHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url, content) => {
    const parsedUrl = parseUrl(url)

    if (!content || !parsedUrl || !isCommunityPath(parsedUrl.pathname)) {
      return []
    }

    // The page carries the community icon as og:image, and no og:image when it has none.
    const ogImage = getMetaContent(content, 'og:image')

    if (!isNonEmptyString(ogImage)) {
      return []
    }

    return [{ uri: ogImage }]
  },
}
