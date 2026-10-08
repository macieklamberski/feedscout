import { getPathSegments, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  type Element,
  findDescendant,
  findElement,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers singleUserArchive, singleUserLanguage, singleUserPage, singleUserPost, tag (guess, html), partly covers blog, blogTag, post.

const tagPathRegex = /\/tag:([^/]+)/i
const rootRouteRegex = /^\/(?:(?:tag|lang):|page\/\d+(?:\/|$)|archive\/?$)/i
const blogPathRegex = /^\/(?:[^/]+\/)?$/
const excludedPaths = ['read', 'about', 'login', 'signup', 'me', 'api', 'pad', 'privacy']

const getUrlBlogPath = (url: string): string | undefined => {
  const { pathname } = new URL(url)
  const [first] = getPathSegments(url)

  if (!first || isAnyOf(first, excludedPaths)) {
    return
  }

  // A single-user instance serves its tag, language, page and archive routes at the root.
  if (rootRouteRegex.test(pathname)) {
    return '/'
  }

  return `/${first}/`
}

// A single-user instance serves its one blog at the root, and the blog title links to it.
const getBlogPath = (content: string | undefined): string | undefined => {
  const title = findElement(content, (element) => element.attribs.id === 'blog-title')

  if (!title) {
    return
  }

  const href = findDescendant(title, (element) => element.name === 'a')?.attribs.href

  if (!href || !blogPathRegex.test(href)) {
    return
  }

  return href
}

const isWriteStylesheet = (element: Element): boolean => {
  return element.attribs.href?.startsWith('/css/write.css') ?? false
}

export const isWritefreelyHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'WriteFreely') ||
    findElement(content, isWriteStylesheet) !== undefined ||
    // A Write.as blog on its own domain runs the same routes under the `Write.as` generator.
    hasMetaContent(content, 'generator', 'Write.as')
  )
}

export type WritefreelyPage = { blogPath: string; tag?: string }

const getWritefreelyPage = (
  url: string,
  content: string | undefined,
): WritefreelyPage | undefined => {
  const urlBlogPath = getUrlBlogPath(url)

  if (!urlBlogPath) {
    return
  }

  return {
    blogPath: getBlogPath(content) ?? urlBlogPath,
    tag: new URL(url).pathname.match(tagPathRegex)?.[1],
  }
}

export const writefreelyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isWritefreelyHtml })) {
      return false
    }

    return Boolean(getUrlBlogPath(url))
  },

  resolve: (url, content) => {
    const page = getWritefreelyPage(url, content)

    if (!page) {
      return []
    }

    const { origin } = new URL(url)
    const { blogPath, tag } = page
    const uris: Array<DiscoverUriEntry> = []

    if (tag) {
      uris.push({
        uri: `${origin}${blogPath}tag:${tag}/feed/`,
        hint: composeHint('writefreely:tag'),
      })
    }

    uris.push({ uri: `${origin}${blogPath}feed/`, hint: composeHint('writefreely:blog') })

    if (blogPath !== '/') {
      uris.push({ uri: `${origin}/read/feed/`, hint: composeHint('writefreely:reader') })
    }

    return uris
  },
}
