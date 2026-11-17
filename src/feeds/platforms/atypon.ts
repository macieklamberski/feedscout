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
// and on Wiley at `/feed/{code}/most-recent`, so the table reads those spellings as well. Wiley
// serves its journal and most cited feeds as RSS and every other feed as RSS 1.0, so its journal
// rows come before the rows of every other host.
const feeds = definePlatformFeeds(
  'atypon',
  [
    {
      key: 'journal',
      main: 'https://onlinelibrary.wiley.com/action/showFeed?type=etoc&feed=rss&jc={code}',
      format: 'rss',
      aliases: [
        'https://onlinelibrary.wiley.com/action/showFeed/feed?type=etoc&jc={code}',
        'https://onlinelibrary.wiley.com/feed/{code}/most-recent',
      ],
    },
    {
      key: 'journal',
      main: '{scheme}://{host}/action/showFeed?type=etoc&feed=rss&jc={code}',
      format: 'rdf',
      aliases: [
        '{scheme}://{host}/action/showFeed/feed?type=etoc&jc={code}',
        'https://www.tandfonline.com/feed/rss/{code}',
      ],
    },
    {
      key: 'most-cited',
      main: 'https://onlinelibrary.wiley.com/feed/{code}/most-cited',
      format: 'rss',
      aliases: [
        'https://onlinelibrary.wiley.com/action/showMostCitedArticlesFeed?journalCode={code}',
      ],
    },
    {
      key: 'ahead-of-print',
      main: '{scheme}://{host}/action/showFeed?type=axatoc&feed=rss&jc={code}',
      format: 'rdf',
      aliases: ['{scheme}://{host}/action/showFeed/feed?type=axatoc&jc={code}'],
    },
    // A saved search or a topic feed names its query in values no page URL gives.
    {
      key: 'search',
      main: '{scheme}://{host}/action/showFeed?type=search&feed=rss&query={query}',
      format: 'rdf',
      aliases: ['{scheme}://{host}/action/showFeed/feed?type=search&query={query}'],
    },
    {
      key: 'topic',
      main: '{scheme}://{host}/action/showFeed?type=searchTopic&taxonomyCode={taxonomy}&tagCode={tag}',
    },
  ],
  { hosts: { exact: hosts } },
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.isWiley) {
      return [
        page.getFeedEntry('journal', { code: parsed.code }, 'rss'),
        page.getFeedEntry('ahead-of-print', { code: parsed.code }, 'rdf'),
        page.getFeedEntry('most-cited', { code: parsed.code }, 'rss'),
      ]
    }

    return [
      page.getFeedEntry('journal', { code: parsed.code }, 'rdf'),
      page.getFeedEntry('ahead-of-print', { code: parsed.code }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
