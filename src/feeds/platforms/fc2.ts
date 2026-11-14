import { getQueryParam, getSubdomain, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, fc2Net, numberedBlog (html).

export type Fc2Url =
  | { kind: 'blog' }
  | { kind: 'category'; category: string }
  | { kind: 'tag'; tag: string }

// A blog is one label under fc2.net.
const domains = ['fc2.net']

const numberedSubdomainRegex = /^(?<blog>[^.]+)\.blog\d*$/i
// A blog on fc2.com is one label under blog.fc2.com or a numbered blog{n}.fc2.com.
const blogDomainRegex = /^blog\d*\.fc2\.com$/i
// A category page and its later pages, /blog-category-{n}.html and /blog-category-{n}-{page}.html.
const categoryPathRegex = /^\/blog-category-(\d+)(?:-\d+)?\.html$/i

const feeds = definePlatformFeeds(
  [
    { key: 'fc2:posts', template: '{scheme}://{host}/?xml' },
    { key: 'fc2:comments', template: '{scheme}://{host}/?xml&comment' },
    { key: 'fc2:trackbacks', template: '{scheme}://{host}/?xml&trackback' },
    // The posts narrowed to one category or one tag. Their pages link only the posts feed.
    { key: 'fc2:category', template: '{scheme}://{host}/?xml&category={category}' },
    { key: 'fc2:tag', template: '{scheme}://{host}/?xml&utag={tag}' },
  ],
  { domains: [...domains, blogDomainRegex] },
)

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
        page.getFeedEntry('fc2:category', { category: parsed.category }),
        page.getFeedEntry('fc2:posts'),
        page.getFeedEntry('fc2:comments'),
        page.getFeedEntry('fc2:trackbacks'),
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('fc2:tag', { tag: parsed.tag }),
        page.getFeedEntry('fc2:posts'),
        page.getFeedEntry('fc2:comments'),
        page.getFeedEntry('fc2:trackbacks'),
      ]
    }

    return [
      page.getFeedEntry('fc2:posts'),
      page.getFeedEntry('fc2:comments'),
      page.getFeedEntry('fc2:trackbacks'),
    ]
  },

  // The table strips a `www` label above a blog, so the page parser refuses that host first.
  getFeedHint: (url) => {
    if (!parseFc2Url(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
