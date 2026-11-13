import { getQueryParam, getSubdomain, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, fc2Net, numberedBlog (html), partly covers 2nt.

export type Fc2Url = { kind: 'blog'; category?: string; tag?: string }

// A blog is one label under these domains.
const domains = ['blog.2nt.com', 'fc2.net']

const numberedSubdomainRegex = /^(?<blog>[^.]+)\.blog\d*$/i
// A blog on fc2.com is one label under blog.fc2.com or a numbered blog{n}.fc2.com.
const blogDomainRegex = /^blog\d*\.fc2\.com$/i
// A category page past the first is /blog-category-{n}-{page}.html.
const categoryPathRegex = /^\/blog-category-(\d+)(?:-\d+)?\.html$/i

const feeds = definePlatformFeeds(
  [
    { key: 'fc2:posts', template: '{scheme}://{host}/?xml' },
    { key: 'fc2:comments', template: '{scheme}://{host}/?xml&comment' },
    { key: 'fc2:trackbacks', template: '{scheme}://{host}/?xml&trackback' },
    { key: 'fc2:category', template: '{scheme}://{host}/?xml&category={category}' },
    { key: 'fc2:tag', template: '{scheme}://{host}/?xml&utag={tag}' },
  ],
  { domains: [...domains, blogDomainRegex] },
)

// A category page, /blog-category-{n}.html or /?cat={n}, and a tag page, /?tag={tag}, link the
// feed of that category or tag.
const parseBlogUrl = (url: string): Fc2Url => {
  const parsedUrl = parseUrl(url)
  const category =
    getQueryParam(parsedUrl, 'cat') ?? parsedUrl?.pathname.match(categoryPathRegex)?.[1]
  const tag = getQueryParam(parsedUrl, 'tag')

  if (category && digitsRegex.test(category)) {
    return { kind: 'blog', category }
  }

  if (tag) {
    return { kind: 'blog', tag }
  }

  return { kind: 'blog' }
}

export const parseFc2Url = (url: string): Fc2Url | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (blog) {
    return parseBlogUrl(url)
  }

  // A blog on fc2.com is one label above a blog or blog{n} label.
  const numberedSubdomain = getSubdomain(url, 'fc2.com')
  const numberedBlog = numberedSubdomain?.match(numberedSubdomainRegex)?.groups?.blog

  if (numberedBlog && !isAnyOf(numberedBlog, 'www')) {
    return parseBlogUrl(url)
  }
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

    if (parsed.category) {
      return [
        page.getFeedEntry('fc2:category', { category: parsed.category }),
        page.getFeedEntry('fc2:posts'),
        page.getFeedEntry('fc2:comments'),
        page.getFeedEntry('fc2:trackbacks'),
      ]
    }

    if (parsed.tag) {
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
