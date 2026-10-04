import { getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = [
  'air-nifty.com',
  'cocolog-nifty.com',
  'cocolog-tnc.com',
  'cocolog-wbs.com',
  'moe-nifty.com',
  'tea-nifty.com',
  'txt-nifty.com',
  'way-nifty.com',
]

// A first segment with a dot is an uploaded file or the `.shared` assets, never a blog.
const blogRegex = /^\/([^/.]+)(?:\/|$)/
const feedPathRegex = /^\/([^/.]+)\/(?:atom\.xml|index\.rdf|rss\.xml)$/i

// The portal, which app.cocolog-nifty.com redirects to.
const excludedSubdomains = ['app', 'www']

export type CocologPage = { blog: string }

const getCocologPage = (url: string, content: string | undefined): CocologPage | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A nested label such as app.f.cocolog-nifty.com is a service host, never a blog.
  if (!subdomain || subdomain.includes('.') || isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  const { hostname, pathname } = new URL(url)
  const blog = pathname.match(blogRegex)?.[1]

  if (blog) {
    return { blog }
  }

  // One account hosts several blogs, each under its own path, and the home page names only one
  // of them, in its feed links.
  const link = findElement(content, (element) => {
    if (element.name !== 'link' || element.attribs.rel !== 'alternate') {
      return false
    }

    const feedUrl = parseUrl(element.attribs.href ?? '', url)

    return feedUrl?.hostname === hostname && feedPathRegex.test(feedUrl.pathname)
  })
  const linkedBlog = parseUrl(link?.attribs.href ?? '', url)?.pathname.match(feedPathRegex)?.[1]

  if (!linkedBlog) {
    return
  }

  return { blog: linkedBlog }
}

export const cocologHandler: PlatformHandler = {
  match: (url, content) => {
    return getCocologPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getCocologPage(url, content)

    if (!page) {
      return []
    }

    const blogUrl = `${new URL(url).origin}/${page.blog}`

    return [
      { uri: `${blogUrl}/atom.xml`, hint: composeHint('cocolog:posts', 'atom') },
      { uri: `${blogUrl}/index.rdf`, hint: composeHint('cocolog:posts', 'rdf') },
      { uri: `${blogUrl}/rss.xml`, hint: composeHint('cocolog:posts', 'rss') },
    ]
  },
}
