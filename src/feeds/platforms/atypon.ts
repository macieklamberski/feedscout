import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Unmeasured, bot wall.

export type AtyponUrl = { kind: 'journal'; code: string; isWiley: boolean }

const hosts = [
  'ascelibrary.org',
  'dl.acm.org',
  'epubs.siam.org',
  'journals.sagepub.com',
  'onlinelibrary.wiley.com',
  'pubsonline.informs.org',
  'www.healthaffairs.org',
  'www.journals.uchicago.edu',
  'www.liebertpub.com', // Redirects every journal path to journals.sagepub.com
  'www.nejm.org',
  'www.science.org',
  'www.tandfonline.com',
]
const mostCitedHosts = ['onlinelibrary.wiley.com']

const journalRegex = /^\/(?:toc|journals?|loi|home)\/(\w+)(?:\/|$)/i

// The journal feed is also served at `showFeed/feed`, on Taylor & Francis at `/feed/rss/{code}`
// and on Wiley at `/feed/{code}/most-recent`, so the table reads those spellings as well.
const feeds = definePlatformFeeds(
  [
    {
      key: 'atypon:journal',
      template: 'https://{host}/action/showFeed?type=etoc&feed=rss&jc={code}',
    },
    { key: 'atypon:journal', template: 'https://{host}/action/showFeed/feed?type=etoc&jc={code}' },
    { key: 'atypon:journal', template: 'https://www.tandfonline.com/feed/rss/{code}' },
    { key: 'atypon:journal', template: 'https://onlinelibrary.wiley.com/feed/{code}/most-recent' },
    {
      key: 'atypon:most-cited',
      template: 'https://onlinelibrary.wiley.com/feed/{code}/most-cited',
    },
  ],
  { hosts },
)

export const parseAtyponUrl = (url: string): AtyponUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  const code = pathname.match(journalRegex)?.[1]

  if (!code) {
    return
  }

  return { kind: 'journal', code, isWiley: isHostOf(url, mostCitedHosts) }
}

export const atyponHandler: PlatformHandler = {
  match: (url) => {
    return parseAtyponUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAtyponUrl(url)

    if (!parsed) {
      return []
    }

    const { hostname } = new URL(url)
    const uris = [feeds.getFeedEntry('atypon:journal', { host: hostname, code: parsed.code })]

    if (parsed.isWiley) {
      uris.push(feeds.getFeedEntry('atypon:most-cited', { code: parsed.code }))
    }

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
