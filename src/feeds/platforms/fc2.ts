import { getQueryParam, getSubdomain, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

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
  'fc2',
  [
    { key: 'posts', main: '{scheme}://{host}/?xml' },
    { key: 'comments', main: '{scheme}://{host}/?xml&comment' },
    { key: 'trackbacks', main: '{scheme}://{host}/?xml&trackback' },
    // The posts narrowed to one category or one tag. Their pages link only the posts feed.
    { key: 'category', main: '{scheme}://{host}/?xml&category={category}' },
    { key: 'tag', main: '{scheme}://{host}/?xml&utag={tag}' },
  ],
  { hosts: { tenants: [...domains, blogDomainRegex] } },
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

  // The table strips a `www` label above a blog, so the page parser refuses that host first.
  getFeedHint: (url) => {
    if (!parseFc2Url(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
