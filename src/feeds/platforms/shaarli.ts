import { shaarli } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShaarliPage = { baseUrl: string }

const feeds = withHintLabels(shaarli.feeds)

export const isShaarliHtml = (content: string): boolean => {
  return hasElementWithId(content, 'shaarli-menu')
}

export const isShaarliHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('shaarli')
}

// Shaarli 0.12 and later print the mount path in `js_base_path`.
const getShaarliPage = (url: string, content: string | undefined): ShaarliPage | undefined => {
  const page = shaarli.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const input = findElement(content, (element) => {
    return element.name === 'input' && element.attribs.name === 'js_base_path'
  })
  const basePath = input?.attribs.value

  if (basePath === undefined) {
    return { baseUrl: page.params.root }
  }

  return { baseUrl: `${new URL(url).origin}${basePath}` }
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
      feeds.getFeedSpellings('posts', { root: baseUrl }, 'rss'),
      feeds.getFeedEntry('posts', { root: baseUrl }, 'atom'),
    ]
  },
}
