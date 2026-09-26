import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasElementWithId } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const scriptSegmentRegex = /\/[^/]*\.php$/i
const trailingSlashRegex = /\/$/

export const isShaarliHtml = (content: string): boolean => {
  return hasElementWithId(content, 'shaarli-menu')
}

export const isShaarliHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('shaarli')
}

// Shaarli 0.12 and later print the mount path in `js_base_path`. Older installs
// route every page through one `index.php`, so its directory is the mount path.
const getBasePath = (pathname: string, content?: string): string => {
  const directory = pathname.replace(scriptSegmentRegex, '').replace(trailingSlashRegex, '')
  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.name === 'js_base_path'
  })

  return input?.attribs.value ?? directory
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
    const { origin, pathname } = new URL(url)
    const baseUrl = `${origin}${getBasePath(pathname, content)}`

    return [
      { uri: `${baseUrl}/feed/rss`, hint: composeHint('shaarli:posts', 'rss') },
      { uri: `${baseUrl}/feed/atom`, hint: composeHint('shaarli:posts', 'atom') },
      // Installs older than 0.12 answer 404 on `/feed/*` and serve this instead.
      { uri: `${baseUrl}/?do=rss`, hint: composeHint('shaarli:posts-legacy') },
    ]
  },
}
