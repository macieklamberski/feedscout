import { isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  type Element,
  findDescendant,
  findElement,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers singleUserLanguage, singleUserPage, singleUserPost, tag (guess, html), partly covers blog, post.

const tagPathRegex = /\/tag:([^/]+)/i
const rootRouteRegex = /^\/(?:(?:tag|lang):|page\/\d+(?:\/|$))/i
const blogPathRegex = /^\/(?:[^/]+\/)?$/
const excludedPaths = ['read', 'about', 'login', 'signup', 'me', 'api', 'pad', 'privacy']

const getUrlBlogPath = (url: string): string | undefined => {
  const { pathname } = new URL(url)
  const [first] = pathname.split('/').filter(Boolean)

  if (!first || isAnyOf(first, excludedPaths)) {
    return
  }

  // A single-user instance serves its tag, language and page routes at the root.
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

export const writefreelyHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isWritefreelyHtml(content)) {
        return false
      }

      return Boolean(getUrlBlogPath(url))
    } catch {}

    return false
  },

  resolve: (url, content) => {
    const { origin, pathname } = new URL(url)
    const urlBlogPath = getUrlBlogPath(url)

    if (!urlBlogPath) {
      return []
    }

    const blogPath = getBlogPath(content) ?? urlBlogPath
    const tag = pathname.match(tagPathRegex)?.[1]
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
