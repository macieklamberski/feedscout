import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

const domains = ['wordpress.com']
const categoryRegex = /^\/category\/([^/]+)/i
const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i
const yearRegex = /^\/(\d{4})\/?$/
const yearMonthRegex = /^\/(\d{4})\/(\d{2})\/?$/
const dayRegex = /^\/(\d{4})\/(\d{2})\/(\d{2})\/?$/
const trailingSlashRegex = /\/$/
const feedSegmentRegex = /\/feed(?:\/|$)/i

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
    {
      uri: [`${base}/feed/rdf/`, `${base}/?feed=rdf`],
      hint: composeHint(key, 'rdf'),
    },
  ]
}

export const wordpressHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []
    let archiveMatched = false

    for (const { regex, hintKey, route } of archives) {
      const archiveMatch = pathname.match(regex)

      if (!archiveMatch) {
        continue
      }

      archiveMatched = true
      const archivePath = route
        ? `/${route}/${archiveMatch[1]}`
        : archiveMatch[0].replace(trailingSlashRegex, '')
      uris.push(...getFeedEntries(`${origin}${archivePath}`, hintKey))
    }

    // Post page: any non-root, non-archive, non-feed path.
    if (!archiveMatched && pathname !== '/' && !feedSegmentRegex.test(pathname)) {
      const base = `${origin}${pathname.replace(trailingSlashRegex, '')}`

      uris.push(...getFeedEntries(base, 'wordpress:post-comments'))
    }

    uris.push(...getFeedEntries(origin, 'wordpress:posts'))

    // The site-wide comments feed takes its query form from the site root, not /comments.
    uris.push({
      uri: [
        `${origin}/comments/feed/`,
        `${origin}/?feed=comments-rss`,
        `${origin}/comments/feed/rss2/`,
        `${origin}/?feed=comments-rss2`,
      ],
      hint: composeHint('wordpress:comments', 'rss'),
    })
    uris.push({
      uri: [`${origin}/comments/feed/atom/`, `${origin}/?feed=comments-atom`],
      hint: composeHint('wordpress:comments', 'atom'),
    })
    uris.push({
      uri: [`${origin}/comments/feed/rdf/`, `${origin}/?feed=comments-rdf`],
      hint: composeHint('wordpress:comments', 'rdf'),
    })

    return uris
  },
}
