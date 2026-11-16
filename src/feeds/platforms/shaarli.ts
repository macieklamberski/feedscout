import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  findElement,
  getCookieNames,
  getScriptDirectory,
  hasElementWithId,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShaarliPage = { baseUrl: string }

// An instance of any domain is known only by its marker, so its feeds are built here but not
// claimed. Installs older than 0.12 answer 404 on `/feed/*` and serve `/?do=rss` instead, and
// later installs redirect `/?do=rss` to the same feed.
const feeds = definePlatformFeeds([
  { key: 'shaarli:posts', main: '{root}/feed/rss', format: 'rss', aliases: ['{root}/?do=rss'] },
  { key: 'shaarli:posts', main: '{root}/feed/atom', format: 'atom' },
])

export const isShaarliHtml = (content: string): boolean => {
  return hasElementWithId(content, 'shaarli-menu')
}

export const isShaarliHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('shaarli')
}

// Shaarli 0.12 and later print the mount path in `js_base_path`. Older installs
// route every page through one `index.php`, so its directory is the mount path.
const getBasePath = (pathname: string, content: string | undefined): string => {
  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.name === 'js_base_path'
  })

  return input?.attribs.value ?? getScriptDirectory(pathname)
}

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
      feeds.getFeedSpellings('shaarli:posts', { root: baseUrl }, 'rss'),
      feeds.getFeedEntry('shaarli:posts', { root: baseUrl }, 'atom'),
    ]
  },
}
