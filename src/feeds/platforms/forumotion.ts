import { isPlainObject, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getBrandDomainRegex, getJsonLd, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (guess, html), partly covers forum, topic.

export type ForumotionPage =
  | { kind: 'forum'; forumId: string }
  | { kind: 'topic'; forumId: string }
  | { kind: 'home' }

const forumPathRegex = /^\/f(\d+)(?:p\d+)?-/i
const topicPathRegex = /^\/t\d+(?:p\d+)?-/i

// The brands Forumotion lists on forumotion.com/languages, each under any of its domains. Other
// domains Forumotion serves forums on, such as 1fr1.net or forumpro.fr, are left to the marker.
const brands = [
  '666forum',
  'actieforum',
  'ahlamontada',
  'albanianforum',
  'azerbaijaniforum',
  'bosnianforum',
  'bulgarianforum',
  'danskforum',
  'editboard',
  'foroactivo',
  'forocatalan',
  'forum2x2',
  'forumactif',
  'forumattivo',
  'forumcroatian',
  'forumczech',
  'forumeiros',
  'forumfa',
  'forumgratuit',
  'forumgreek',
  'forumhebrew',
  'forumieren',
  'forumjap',
  'forumkorean',
  'forumlt',
  'forummo',
  'forumms',
  'forumotion',
  'forumpolish',
  'forumsc',
  'forumta',
  'forumtl',
  'forumur',
  'forumvi',
  'georgianforum',
  'hungarianforum',
  'icelandforum',
  'indonesianforum',
  'latvianforum',
  'longluntan',
  'macedonianforum',
  'norwegianforum',
  'palstani',
  'serbianforum',
  'slovakforum',
  'slovenianforum',
  'swedishforum',
  'thai-forum',
  'ukraine7',
  'yetkinforum',
]

// The `forum` brand is too generic to match under any domain, so it keeps its one domain.
const domains = ['forum.co.ee', ...brands.map(getBrandDomainRegex)]

// A forum on its own domain is known only by its marker, so its feeds are built here but not
// claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'forumotion:forum', template: '{scheme}://{host}/feed/?f={forumId}', format: 'rss' },
    {
      key: 'forumotion:forum',
      template: '{scheme}://{host}/feed/?f={forumId}&type=atom',
      format: 'atom',
    },
    { key: 'forumotion:latest-topics', template: '{scheme}://{host}/feed/', format: 'rss' },
    {
      key: 'forumotion:latest-topics',
      template: '{scheme}://{host}/feed/?type=atom',
      format: 'atom',
    },
    // Forumotion serves the same feeds at `/rss`, which only claims.
    { key: 'forumotion:forum', template: '{scheme}://{host}/rss?f={forumId}', format: 'rss' },
    {
      key: 'forumotion:forum',
      template: '{scheme}://{host}/rss?f={forumId}&type=atom',
      format: 'atom',
    },
    { key: 'forumotion:latest-topics', template: '{scheme}://{host}/rss', format: 'rss' },
    {
      key: 'forumotion:latest-topics',
      template: '{scheme}://{host}/rss?type=atom',
      format: 'atom',
    },
  ],
  { domains },
)

// Core prints the `_userdata` script in every page head, on every template and domain.
export const isForumotionHtml = (content: string): boolean => {
  return content.includes('_userdata["session_logged_in"]')
}

const getBreadcrumbPaths = (url: string, content: string): Array<string> => {
  const paths: Array<string> = []

  for (const data of getJsonLd(content)) {
    if (!isPlainObject(data) || data['@type'] !== 'BreadcrumbList') {
      continue
    }

    if (!Array.isArray(data.itemListElement)) {
      continue
    }

    for (const element of data.itemListElement) {
      const pathname = parseUrl(element?.item?.['@id'], url)?.pathname

      if (pathname) {
        paths.push(pathname)
      }
    }
  }

  return paths
}

// Forumotion answers a forum id that does not exist with the site-wide feed, and its page with
// a canonical link naming that id. Only the breadcrumb leaves the made-up forum out.
export const getForumotionPage = (url: string, content: string | undefined): ForumotionPage => {
  if (!content) {
    return { kind: 'home' }
  }

  const paths = getBreadcrumbPaths(url, content)
  const lastPath = paths.at(-1) ?? ''
  const forumId = lastPath.match(forumPathRegex)?.[1]

  if (forumId) {
    return { kind: 'forum', forumId }
  }

  const topicForumId = paths.at(-2)?.match(forumPathRegex)?.[1]

  if (topicPathRegex.test(lastPath) && topicForumId) {
    return { kind: 'topic', forumId: topicForumId }
  }

  return { kind: 'home' }
}

export const forumotionHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isForumotionHtml })
  },

  resolve: (url, content) => {
    const page = getForumotionPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    // Forumotion serves no topic feed and ignores `?t=`, so a topic page gets its forum's feed.
    if (page.kind === 'forum' || page.kind === 'topic') {
      const params = { forumId: page.forumId }

      return [
        pageFeeds.getFeedEntry('forumotion:forum', params, 'rss'),
        pageFeeds.getFeedEntry('forumotion:forum', params, 'atom'),
        pageFeeds.getFeedEntry('forumotion:latest-topics', {}, 'rss'),
        pageFeeds.getFeedEntry('forumotion:latest-topics', {}, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('forumotion:latest-topics', {}, 'rss'),
      pageFeeds.getFeedEntry('forumotion:latest-topics', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
