import { fc2 } from 'feedintel'
import { getQueryParam, getSubdomain, isAnyOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type Fc2Url =
  | { kind: 'blog' }
  | { kind: 'category'; category: string }
  | { kind: 'tag'; tag: string }

// A blog is one label under fc2.net.
const domains = fc2.hosts.tenants

const numberedSubdomainRegex = /^(?<blog>[^.]+)\.blog\d*$/i
// A category page and its later pages, /blog-category-{n}.html and /blog-category-{n}-{page}.html.
const categoryPathRegex = /^\/blog-category-(\d+)(?:-\d+)?\.html$/i

const feeds = withHintLabels(fc2.feeds)

const isFc2Blog = (url: URL): boolean => {
  if (getTenantSubdomain(url, domains)) {
    return true
  }

  // A blog on fc2.com is one label above a blog or blog{n} label.
  const numberedSubdomain = getSubdomain(url, 'fc2.com')
  const numberedBlog = numberedSubdomain?.match(numberedSubdomainRegex)?.groups?.blog

  return numberedBlog !== undefined && !isAnyOf(numberedBlog, 'www')
}

export const parseFc2Url = (url: string): Fc2Url | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isFc2Blog(parsedUrl)) {
    return
  }

  const category = parsedUrl.pathname.match(categoryPathRegex)?.[1]

  if (category) {
    return { kind: 'category', category }
  }

  const tag = getQueryParam(parsedUrl.searchParams, 'tag')

  if (tag) {
    return { kind: 'tag', tag }
  }

  return { kind: 'blog' }
}

export const fc2Handler: PlatformHandler = {
  match: (url) => {
    return parseFc2Url(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFc2Url(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { category: parsed.category }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('comments'),
        page.getFeedEntry('trackbacks'),
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('tag', { tag: parsed.tag }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('comments'),
        page.getFeedEntry('trackbacks'),
      ]
    }

    return [
      page.getFeedEntry('posts'),
      page.getFeedEntry('comments'),
      page.getFeedEntry('trackbacks'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
