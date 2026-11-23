import { writefreely } from 'feedintel'
import { parseUrl, startsWithAnyOf } from 'trousse'
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

const feeds = withHintLabels(writefreely.feeds)

const readPage = (url: string | undefined, root: string) => {
  return writefreely.pages.read(url ?? '', { root })
}

// A single-user instance serves its one blog at the root, and the blog title links to it.
const getBlogPath = (
  content: string | undefined,
  url: string,
  root: string,
): string | undefined => {
  const title = findElement(content, (element) => element.attribs.id === 'blog-title')

  if (!title) {
    return
  }

  const href = findDescendant(title, (element) => element.name === 'a')?.attribs.href
  const link = readPage(parseUrl(href, url)?.href, root)

  if (link?.key === 'home') {
    return '/'
  }

  if (link?.key === 'blog' && link.params.blog) {
    return `/${link.params.blog}/`
  }
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
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const page = readPage(url, parsedUrl.origin)
  const blogPath = getBlogPath(content, url, parsedUrl.origin)

  // The root of a single-user instance is its blog, and a multi-user root redirects to /signup or
  // /read, so only a blog title linking the root names a blog there.
  if (!page || page.key === 'home') {
    if (blogPath !== '/') {
      return
    }

    return { blogPath }
  }

  const urlBlogPath = page.params.blog ? `/${page.params.blog}/` : '/'

  return {
    blogPath: blogPath ?? urlBlogPath,
    tag: page.key === 'tag' ? page.params.tag : undefined,
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
