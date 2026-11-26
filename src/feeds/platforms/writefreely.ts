import { writefreely } from 'feedintel'
import { getPathSegments, parseUrl, startsWithAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  type Element,
  findDescendant,
  findElement,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: blog, tag.
// Handler needed for: reader.

export type WritefreelyPage = { blogPath: string; tag?: string }

const tagPathRegex = /\/tag:([^/]+)/i
const rootRouteRegex = /^\/(?:(?:tag|lang):|page\/\d+(?:\/|$)|archive\/?$)/i
const blogPathRegex = /^\/(?:[^/]+\/)?$/

const feeds = withHintLabels(writefreely.feeds)

const getUrlBlogPath = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const [blogOrRoute] = getPathSegments(url)

  if (!blogOrRoute) {
    return
  }

  // A single-user instance serves its tag, language, page and archive routes at the root.
  if (rootRouteRegex.test(pathname)) {
    return '/'
  }

  return `/${blogOrRoute}/`
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
  return startsWithAnyOf(element.attribs.href, '/css/write.css')
}

export const isWritefreelyHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'WriteFreely') ||
    findElement(content, isWriteStylesheet) !== undefined ||
    // A Write.as blog on its own domain runs the same routes under the `Write.as` generator.
    hasMetaContent(content, 'generator', 'Write.as')
  )
}

const getWritefreelyPage = (
  url: string,
  content: string | undefined,
): WritefreelyPage | undefined => {
  const urlBlogPath = getUrlBlogPath(url)
  const blogPath = getBlogPath(content)

  // The root of a single-user instance is its blog, and a multi-user root redirects to /signup or
  // /read, so only a blog title linking the root names a blog there.
  if (!urlBlogPath) {
    if (blogPath !== '/') {
      return
    }

    return { blogPath }
  }

  return {
    blogPath: blogPath ?? urlBlogPath,
    tag: parseUrl(url)?.pathname.match(tagPathRegex)?.[1],
  }
}

export const writefreelyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isWritefreelyHtml })) {
      return false
    }

    return getWritefreelyPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getWritefreelyPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = {
      blog: page.blogPath === '/' ? undefined : page.blogPath.slice(1, -1),
      tag: page.tag,
    }

    // The instance reader holds every blog of a multi-user instance.
    if (params.blog && params.tag) {
      return [
        pageFeeds.getFeedEntry('tag', params),
        pageFeeds.getFeedEntry('blog', params),
        pageFeeds.getFeedEntry('reader'),
      ]
    }

    if (params.blog) {
      return [pageFeeds.getFeedEntry('blog', params), pageFeeds.getFeedEntry('reader')]
    }

    if (params.tag) {
      return [pageFeeds.getFeedEntry('tag', params), pageFeeds.getFeedEntry('blog', params)]
    }

    return [pageFeeds.getFeedEntry('blog', params)]
  },
}
