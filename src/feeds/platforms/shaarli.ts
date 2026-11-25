import { shaarli } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShaarliPage = { base?: string | Array<string> }

const feeds = withHintLabels(shaarli.feeds)

export const isShaarliHtml = (content: string): boolean => {
  return hasElementWithId(content, 'shaarli-menu')
}

export const isShaarliHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('shaarli')
}

// Shaarli 0.12 and later print the mount path in `js_base_path`.
const getShaarliPage = (url: string, content: string | undefined): ShaarliPage | undefined => {
  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.name === 'js_base_path'
  })
  const basePath = input?.attribs.value

  if (basePath !== undefined) {
    return { base: basePath }
  }

  const page = shaarli.pages.readUrl(url, { isAnyHost: true })

  if (!page) {
    return
  }

  return { base: page.values.base }
}

export const shaarliHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isShaarliHtml, headers: isShaarliHeaders })
  },

  resolve: (url, content) => {
    const page = getShaarliPage(url, content)
    const pageFeeds = feeds.forSite(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = { base: page.base }

    return [
      pageFeeds.getFeedSpellings('posts', params, 'rss'),
      pageFeeds.getFeedEntry('posts', params, 'atom'),
    ]
  },
}
