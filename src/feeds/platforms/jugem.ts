import { jugem } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JugemUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'theme'; category: string; theme: string }
  | { kind: 'customDomain' }

const cookieScriptPath = './template/js/cookie.js'

const feeds = withHintLabels(jugem.feeds)

const isJugemAsset = (assetUrl: string | undefined): boolean => {
  if (!assetUrl) {
    return false
  }

  return assetUrl === cookieScriptPath || jugem.pages.read(assetUrl)?.key === 'asset'
}

// Every blog template loads its favicon or scripts from imaging.jugem.jp, or the cookie script by
// its relative path, on a custom domain too.
export const isJugemHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    if (element.name === 'link') {
      return isJugemAsset(element.attribs.href)
    }

    if (element.name === 'script') {
      return isJugemAsset(element.attribs.src)
    }

    return false
  })

  return asset !== undefined
}

export const parseJugemUrl = (url: string): JugemUrl | undefined => {
  const page = jugem.pages.read(url)

  if (!page) {
    return { kind: 'customDomain' }
  }

  if (page.key === 'theme') {
    return { kind: 'theme', category: page.params.category, theme: page.params.theme }
  }

  if (page.key === 'blog') {
    return { kind: 'blog', blog: page.params.blog }
  }
}

export const jugemHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseJugemUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isJugemHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseJugemUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'theme') {
      return [page.getFeedEntry('theme', { category: parsed.category, theme: parsed.theme }, 'rdf')]
    }

    return [page.getFeedEntry('posts', {}, 'rdf'), page.getFeedEntry('posts', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
