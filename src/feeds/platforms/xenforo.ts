import { xenforo } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type XenforoUrl =
  | { kind: 'forum'; basePath: string; route: string; forumPath: string }
  | { kind: 'board' }
export type XenforoPage =
  | { kind: 'forum'; basePath: string; route: string; forumPath: string }
  | { kind: 'board'; basePath: string }

// XF2 prints the path the board is mounted under in its script config.
const basePathRegex = /\bbasePath:\s*'(?<basePath>(?:\/[^'/]+)*)\/?'/

// XF2 puts `id="XF"` on the html element and XF1 put `id="XenForo"` there.
const appRootIds = ['XF', 'XenForo']

const feeds = withHintLabels(xenforo.feeds)

export const isXenforoHtml = (content: string): boolean => {
  const root = findElement(content, (element) => {
    return element.name === 'html' && appRootIds.includes(element.attribs.id ?? '')
  })

  return root !== undefined
}

const getConfigBasePath = (url: string, content: string | undefined): string => {
  const basePath = content?.match(basePathRegex)?.groups?.basePath

  // The path counts only when it holds the page.
  if (!basePath || !xenforo.pages.read(url, { root: `${new URL(url).origin}${basePath}` })) {
    return ''
  }

  return basePath
}

export const parseXenforoUrl = (url: string): XenforoUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // A board is routinely mounted under a sub-path such as `/community`, in front of the route.
  const page = xenforo.pages.read(url, { isAnyHost: true })
  const route = page?.row.variant

  if (page?.key === 'forum' && route) {
    const basePath = page.params.root.slice(parsedUrl.origin.length)

    return { kind: 'forum', basePath, route, forumPath: page.params.forumPath }
  }

  return { kind: 'board' }
}

export const getXenforoPage = (
  url: string,
  content: string | undefined,
): XenforoPage | undefined => {
  const parsed = parseXenforoUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'forum') {
    return parsed
  }

  return { kind: 'board', basePath: getConfigBasePath(url, content) }
}

export const xenforoHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isXenforoHtml })) {
      return false
    }

    return parseXenforoUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getXenforoPage(url, content)

    if (!page) {
      return []
    }

    const root = `${new URL(url).origin}${page.basePath}`

    if (page.kind === 'forum') {
      return [
        feeds.getFeedEntry('forum', { root, route: page.route, forumPath: page.forumPath }),
        feeds.getFeedEntry('site', { root, route: page.route }),
      ]
    }

    return [feeds.getFeedSpellings('site', { root })]
  },
}
