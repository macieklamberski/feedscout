import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, getCookieNames } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const basePathRegex = /name="js_base_path" value="([^"]*)"/
const lastSegmentRegex = /\/[^/]*$/

export const isShaarliHtml = (content: string): boolean => {
  return content.includes('id="shaarli-menu"')
}

export const isShaarliHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('shaarli')
}

// Shaarli 0.12 and later print the mount path in `js_base_path`. Older installs
// route every page through one `index.php`, so its directory is the mount path.
const getBasePath = (pathname: string, content?: string): string => {
  return content?.match(basePathRegex)?.[1] ?? pathname.replace(lastSegmentRegex, '')
}

export const shaarliHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!URL.canParse(url)) {
      return false
    }

    if (content && isShaarliHtml(content)) {
      return true
    }

    if (headers && isShaarliHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url, content) => {
    try {
      const { origin, pathname } = new URL(url)
      const baseUrl = `${origin}${getBasePath(pathname, content)}`

      return [
        { uri: `${baseUrl}/feed/rss`, hint: composeHint('shaarli:posts', 'rss') },
        { uri: `${baseUrl}/feed/atom`, hint: composeHint('shaarli:posts', 'atom') },
        // Installs older than 0.12 answer 404 on `/feed/*` and serve this instead.
        { uri: `${baseUrl}/?do=rss`, hint: composeHint('shaarli:posts-legacy') },
      ]
    } catch {}

    return []
  },
}
