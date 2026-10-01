import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  getCookieNames,
  getScriptDirectory,
  hasElementWithId,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export const isShaarliHtml = (content: string): boolean => {
  return hasElementWithId(content, 'shaarli-menu')
}

export const isShaarliHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('shaarli')
}

// Shaarli 0.12 and later print the mount path in `js_base_path`. Older installs
// route every page through one `index.php`, so its directory is the mount path.
const getBasePath = (pathname: string, content?: string): string => {
  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.name === 'js_base_path'
  })

  return input?.attribs.value ?? getScriptDirectory(pathname)
}

export type ShaarliPage = { baseUrl: string }

const getShaarliPage = (url: string, content: string | undefined): ShaarliPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  return { baseUrl: `${parsedUrl.origin}${getBasePath(parsedUrl.pathname, content)}` }
}

export const shaarliHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isShaarliHtml, headers: isShaarliHeaders })
  },

  resolve: (url, content) => {
    const page = getShaarliPage(url, content)

    if (!page) {
      return []
    }

    const { baseUrl } = page

    return [
      { uri: `${baseUrl}/feed/rss`, hint: composeHint('shaarli:posts', 'rss') },
      { uri: `${baseUrl}/feed/atom`, hint: composeHint('shaarli:posts', 'atom') },
      // Installs older than 0.12 answer 404 on `/feed/*` and serve this instead.
      { uri: `${baseUrl}/?do=rss`, hint: composeHint('shaarli:posts-legacy') },
    ]
  },
}
