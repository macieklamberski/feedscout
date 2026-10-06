import { getSubdomain, isAnyOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, category, post, tag.

export type WordpressUrl =
  | { kind: 'archive'; path: string; hintKey: string }
  | { kind: 'post'; path: string }
  | { kind: 'home' }

const domains = [
  'edublogs.org',
  'home.blog',
  'hypotheses.org',
  'unblog.fr',
  'wordpress.com',
  'wpcomstaging.com',
]
const postIdDomains = ['hypotheses.org']
// A nested category's path holds every parent slug and ends at WordPress's endpoint words.
const categoryRegex = /^\/category\/(.+?)(?:\/(?:feed|rdf|rss|rss2|atom|embed|page)(?:\/|$)|\/?$)/i
const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i
const yearRegex = /^\/(\d{4})\/?$/
const yearMonthRegex = /^\/(\d{4})\/(\d{2})\/?$/
const dayRegex = /^\/(\d{4})\/(\d{2})\/(\d{2})\/?$/
const postIdRegex = /^\/\d+\/?$/
const trailingSlashRegex = /\/$/
const feedSegmentRegex = /\/feed(?:\/|$)/i

// The www subdomain is the platform's own site, never a blog.
const excludedSubdomains = ['www']

// An unregistered {name}.home.blog redirects to home.blog, whose every page links this feed.
const platformFeedUrl = 'https://home.blog/feed/'

// The route word is emitted as listed, so a capitalized path still yields the canonical feed.
const archives: Array<{ regex: RegExp; hintKey: string; route?: string }> = [
  { regex: categoryRegex, hintKey: 'wordpress:category', route: 'category' },
  { regex: tagRegex, hintKey: 'wordpress:tag', route: 'tag' },
  { regex: authorRegex, hintKey: 'wordpress:author', route: 'author' },
  { regex: dayRegex, hintKey: 'wordpress:date-archive' },
  { regex: yearMonthRegex, hintKey: 'wordpress:date-archive' },
  { regex: yearRegex, hintKey: 'wordpress:date-archive' },
]

// WordPress serves every feed of a page both under its /feed/ path and as a ?feed= query.
const getFeedEntries = (base: string, key: string): Array<DiscoverUriEntry> => {
  return [
    {
      uri: [`${base}/feed/`, `${base}/?feed=rss`, `${base}/feed/rss2/`, `${base}/?feed=rss2`],
      hint: composeHint(key, 'rss'),
    },
    {
      uri: [`${base}/feed/atom/`, `${base}/?feed=atom`],
      hint: composeHint(key, 'atom'),
    },
  ]
}

// WordPress has no RDF comment template, so the RDF form of a comment feed lists posts.
const getPostsFeedEntries = (base: string, key: string): Array<DiscoverUriEntry> => {
  return [
    ...getFeedEntries(base, key),
    {
      uri: [`${base}/feed/rdf/`, `${base}/?feed=rdf`],
      hint: composeHint(key, 'rdf'),
    },
  ]
}

// The page a WordPress URL shows, read from the path, so a WP Engine site reads the same. Only
// hypotheses.org's post-id paths need the host.
export const parseWordpressPage = (url: string): WordpressUrl => {
  const { pathname } = new URL(url)

  // hypotheses.org posts are /{post_id}, so a four-digit id is a post, never a year archive.
  if (isSubdomainOf(url, postIdDomains) && postIdRegex.test(pathname)) {
    return { kind: 'post', path: pathname.replace(trailingSlashRegex, '') }
  }

  for (const { regex, hintKey, route } of archives) {
    const archiveMatch = pathname.match(regex)

    if (!archiveMatch) {
      continue
    }

    const path = route
      ? `/${route}/${archiveMatch[1]}`
      : archiveMatch[0].replace(trailingSlashRegex, '')

    return { kind: 'archive', path, hintKey }
  }

  // Post page: any non-root, non-archive, non-feed path.
  if (pathname !== '/' && !feedSegmentRegex.test(pathname)) {
    return { kind: 'post', path: pathname.replace(trailingSlashRegex, '') }
  }

  return { kind: 'home' }
}

export const parseWordpressUrl = (url: string): WordpressUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A dotted subdomain is an alias of a blog, and the platform's certificate does not cover it.
  // A staging- subdomain is a WordPress.com staging copy of another site.
  if (
    !subdomain ||
    subdomain.includes('.') ||
    subdomain.startsWith('staging-') ||
    isAnyOf(subdomain, excludedSubdomains)
  ) {
    return
  }

  return parseWordpressPage(url)
}

export const composeWordpressFeeds = (
  origin: string,
  parsed: WordpressUrl,
): Array<DiscoverUriEntry> => {
  const uris: Array<DiscoverUriEntry> = []

  if (parsed.kind === 'archive') {
    uris.push(...getPostsFeedEntries(`${origin}${parsed.path}`, parsed.hintKey))
  }

  if (parsed.kind === 'post') {
    uris.push(...getFeedEntries(`${origin}${parsed.path}`, 'wordpress:post-comments'))
  }

  uris.push(...getPostsFeedEntries(origin, 'wordpress:posts'))

  // The site-wide comments feed takes its query form from the site root, not /comments.
  // Without pretty permalinks, ?feed=comments-rss serves the RSS 0.92 posts template.
  uris.push({
    uri: [
      `${origin}/comments/feed/`,
      `${origin}/comments/feed/rss2/`,
      `${origin}/?feed=comments-rss2`,
    ],
    hint: composeHint('wordpress:comments', 'rss'),
  })
  uris.push({
    uri: [`${origin}/comments/feed/atom/`, `${origin}/?feed=comments-atom`],
    hint: composeHint('wordpress:comments', 'atom'),
  })

  return uris
}

export const wordpressHandler: PlatformHandler = {
  match: (url, content) => {
    if (!parseWordpressUrl(url)) {
      return false
    }

    const platformFeedLink = findElement(content, (element) => {
      return (
        element.name === 'link' &&
        element.attribs.rel === 'alternate' &&
        element.attribs.href === platformFeedUrl
      )
    })

    return platformFeedLink === undefined
  },

  resolve: (url) => {
    const parsed = parseWordpressUrl(url)

    if (!parsed) {
      return []
    }

    return composeWordpressFeeds(new URL(url).origin, parsed)
  },
}
