import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasClass, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WildApricotPage =
  | { kind: 'blog'; feedUrl: string }
  | { kind: 'post'; blogUrl: string }
  | { kind: 'events'; eventsUrl: string }

const trailingSlashRegex = /\/$/

const eventsModeLinkClasses = ['calendarModeLink', 'listModeLink']

const domains = ['wildapricot.org']

// A site on a custom domain is known only by its load balancer header, so its feeds are built in
// resolve and claimed only on Wild Apricot's own domain. A module's feed also answers under the
// module's id, which names the blog or the events. A page's own `/RSS` can be either, so it is
// claimed under a key that names neither.
const feeds = definePlatformFeeds(
  [
    {
      key: 'wild-apricot:blog',
      template: '{root}/page-{page}/BlogPost/{id}/RSS',
    },
    {
      key: 'wild-apricot:events',
      template: '{root}/page-{page}/EventModule/{id}/RSS',
    },
    { key: 'wild-apricot:page', template: '{scheme}://{host}/page-{page}/RSS' },
    // A page's feed answers under its friendly path too, and in its widget view, as `/news/RSS`
    // and `/widget/Events/RSS`. Each names its module feed as its self link.
    { key: 'wild-apricot:page', template: '{root}/RSS' },
    { key: 'wild-apricot:page', template: '{root}/widget/RSS' },
    { key: 'wild-apricot:page', template: '{root}/{path}/RSS' },
    { key: 'wild-apricot:page', template: '{root}/widget/{path}/RSS' },
  ],
  { domains },
)

// Wild Apricot answers every page through its load balancer, on its own hosts and on custom
// domains alike.
export const isWildApricotHeaders = (headers: Headers): boolean => {
  return headers.get('x-lb-server')?.endsWith('.wa.local') ?? false
}

const getLinkHref = (content: string, isWantedId: (id: string) => boolean): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'a' && isWantedId(element.attribs.id ?? '')
  })

  return link?.attribs.href
}

const getModuleUrl = (href: string, url: string): string => {
  const { origin, pathname } = new URL(href, url)

  return `${origin}${pathname.replace(trailingSlashRegex, '')}`
}

// A post page links its feed as `/page-{id}/RSS`, which answers 404, and names its blog in the
// back link. The events view switcher names the events page in the list and calendar views.
export const getWildApricotPage = (
  url: string,
  content: string | undefined,
): WildApricotPage | undefined => {
  if (!content) {
    return
  }

  const blogUrl = getLinkHref(content, (id) => id.endsWith('_blogPostView_title_backLink'))

  if (blogUrl) {
    return { kind: 'post', blogUrl: getModuleUrl(blogUrl, url) }
  }

  const feedUrl = getLinkHref(content, (id) => id.endsWith('_blogPostList_rssLink'))

  if (feedUrl) {
    return { kind: 'blog', feedUrl: new URL(feedUrl, url).href }
  }

  const eventsLink = findElement(content, (element) => {
    return element.name === 'a' && eventsModeLinkClasses.some((name) => hasClass(element, name))
  })

  if (eventsLink?.attribs.href) {
    return { kind: 'events', eventsUrl: getModuleUrl(eventsLink.attribs.href, url) }
  }
}

export const wildApricotHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isWildApricotHeaders })) {
      return false
    }

    return getWildApricotPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getWildApricotPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'post') {
      return [{ uri: `${page.blogUrl}/RSS`, hint: composeHint('wild-apricot:blog') }]
    }

    if (page.kind === 'blog') {
      return [{ uri: page.feedUrl, hint: composeHint('wild-apricot:blog') }]
    }

    return [{ uri: `${page.eventsUrl}/RSS`, hint: composeHint('wild-apricot:events') }]
  },

  getFeedHint: feeds.getFeedHint,
}
