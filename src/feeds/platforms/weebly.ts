import { weebly } from 'feedintel'
import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElements } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WeeblyUrl = { kind: 'home' } | { kind: 'blog'; page?: string }
export type WeeblyPage = { kind: 'home'; pages: Array<string> } | { kind: 'blog'; page?: string }

// A page link is one segment with an optional .html, as `/newsletter.html` or `/newsletter`. Any
// other dot marks a file, such as `/favicon.ico`.
const pageLinkRegex = /^\/([^/.]+)(?:\.html)?$/i

const feeds = withHintLabels(weebly.feeds)

export const parseWeeblyUrl = (url: string): WeeblyUrl | undefined => {
  const page = weebly.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'home') {
    return { kind: 'home' }
  }

  return { kind: 'blog', page: page.params.page }
}

export const getWeeblyPage = (url: string, content: string | undefined): WeeblyPage | undefined => {
  const parsed = parseWeeblyUrl(url)

  if (parsed?.kind !== 'home') {
    return parsed
  }

  // A site can run a blog on any of its pages, and the home page links every page, so each page
  // it links is a blog candidate beside the default /blog. Validation drops the pages that are
  // not blogs.
  const pages = new Set(['blog'])
  const { hostname } = new URL(url)
  const anchors = content ? findElements(content, (element) => element.name === 'a') : []

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href, url)

    if (!target || !isHostOf(target, hostname)) {
      continue
    }

    const page = target.pathname.match(pageLinkRegex)?.[1]

    if (page) {
      pages.add(isAnyOf(page, 'blog') ? 'blog' : page)
    }
  }

  return { kind: 'home', pages: [...pages] }
}

export const weeblyHandler: PlatformHandler = {
  match: (url) => {
    return parseWeeblyUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getWeeblyPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const slugs = page.kind === 'home' ? page.pages : [page.page ?? 'blog']

    return slugs.map((slug) => pageFeeds.getFeedEntry('blog', { page: slug }))
  },

  getFeedHint: feeds.getFeedHint,
}
