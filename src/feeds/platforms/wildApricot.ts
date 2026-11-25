import { wildApricot } from 'feedintel'
import { isPresent, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasClass, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// A module's host and path, which a blog on the home page leaves out.
export type WildApricotModule = { scheme: string; host: string; path?: Array<string> }
export type WildApricotPage =
  | { kind: 'blog'; feedUrl: string }
  | { kind: 'post'; blog: WildApricotModule }
  | { kind: 'events'; events: WildApricotModule }

const eventsModeLinkClasses = ['calendarModeLink', 'listModeLink']

const feeds = withHintLabels(wildApricot.feeds)

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

const readModule = (href: string, url: string): WildApricotModule | undefined => {
  const page = wildApricot.pages.read(parseUrl(href, url)?.href ?? '', { isAnyHost: true })

  if (!page) {
    return
  }

  const { scheme, host } = page.params

  if (page.key === 'home') {
    return { scheme, host }
  }

  return { scheme, host, path: page.params.path }
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
  const blog = blogUrl ? readModule(blogUrl, url) : undefined

  if (blog) {
    return { kind: 'post', blog }
  }

  const feedUrl = getLinkHref(content, (id) => id.endsWith('_blogPostList_rssLink'))

  if (feedUrl) {
    return { kind: 'blog', feedUrl: new URL(feedUrl, url).href }
  }

  const eventsLink = findElement(content, (element) => {
    return element.name === 'a' && eventsModeLinkClasses.some((name) => hasClass(element, name))
  })

  const events = eventsLink?.attribs.href ? readModule(eventsLink.attribs.href, url) : undefined

  if (events) {
    return { kind: 'events', events }
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

    if (page.kind === 'post' && page.blog.path) {
      return [feeds.getFeedEntry('blog', page.blog)].filter(isPresent)
    }

    // A blog on the home page serves its feed at the root.
    if (page.kind === 'post') {
      return [feeds.getFeedEntry('site', page.blog)].filter(isPresent)
    }

    if (page.kind === 'blog') {
      return [{ uri: page.feedUrl, hint: composeHint('wild-apricot:blog') }]
    }

    return [feeds.getFeedEntry('events', page.events)].filter(isPresent)
  },

  getFeedHint: feeds.getFeedHint,
}
