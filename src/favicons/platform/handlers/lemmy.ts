import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import {
  isCommunityPath,
  isLemmyHeaders,
  isLemmyHtml,
} from '../../../feeds/platform/handlers/lemmy.js'
import { parseBodyJson } from '../../utils.js'

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

  resolve: async (url, content, _headers, fetchFn) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isCommunityPath(parsedUrl.pathname)) {
      return []
    }

    // The page carries the community icon as og:image, and no og:image when it has none.
    const ogImage = content ? getMetaContent(content, 'og:image') : undefined

    if (isNonEmptyString(ogImage)) {
      return [{ uri: ogImage }]
    }

    if (!fetchFn) {
      return []
    }

    try {
      const name = parsedUrl.pathname.split('/').filter(Boolean)[1]
      const apiUrl = `${parsedUrl.origin}/api/v3/community?name=${encodeURIComponent(name)}`
      const response = await fetchFn(apiUrl)
      const data = parseBodyJson(response.body)
      const icon = data?.community_view?.community?.icon

      if (isNonEmptyString(icon)) {
        return [{ uri: icon }]
      }
    } catch {}

    return []
  },
}
