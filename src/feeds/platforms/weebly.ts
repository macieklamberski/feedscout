import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElements, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WeeblyUrl = { kind: 'home' } | { kind: 'blog'; page?: string }
export type WeeblyPage = { kind: 'home'; pages: Array<string> } | { kind: 'blog'; page?: string }

const domains = ['weebly.com']

// A page address ends in `.html`, which redirects to the bare slug the blog feed sits under.
const htmlSuffixRegex = /\.html$/i
// A page link is one segment with an optional .html, as `/newsletter.html` or `/newsletter`. Any
// other dot marks a file, such as `/favicon.ico`.
const pageLinkRegex = /^\/([^/.]+)(?:\.html)?$/i

export const parseWeeblyUrl = (url: string): WeeblyUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  // A blog sits under its page slug, such as /articles/feed, or under a numeric blog id, such as
  // /1/feed.
  const first = getPathSegments(url)[0]?.replace(htmlSuffixRegex, '')

  if (!first) {
    return { kind: 'home' }
  }

  if (!isAnyOf(first, 'blog')) {
    return { kind: 'blog', page: first }
  }

  return { kind: 'blog' }
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
    const target = parseUrl(anchor.attribs.href ?? '', url)

    if (target?.hostname !== hostname) {
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

    if (!page) {
      return []
    }

    const { origin } = new URL(url)

    if (page.kind === 'home') {
      return page.pages.map((slug) => {
        return { uri: `${origin}/${slug}/feed`, hint: composeHint('weebly:blog') }
      })
    }

    return [{ uri: `${origin}/${page.page ?? 'blog'}/feed`, hint: composeHint('weebly:blog') }]
  },
}
