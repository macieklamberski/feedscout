import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, bot wall.

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
const wileyHost = 'onlinelibrary.wiley.com'

const journalRegex = /^\/(?:toc|journals?|loi|home)\/(\w+)(?:\/|$)/i

export const atyponHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && journalRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    const { origin, host, pathname } = new URL(url)
    const code = pathname.match(journalRegex)?.[1]

    if (!code) {
      return []
    }

    const uris = [
      {
        uri: `${origin}/action/showFeed?type=etoc&feed=rss&jc=${code}`,
        hint: composeHint('atypon:journal'),
      },
    ]

    if (host === wileyHost) {
      uris.push({
        uri: `${origin}/feed/${code}/most-cited`,
        hint: composeHint('atypon:most-cited'),
      })
    }

    return uris
  },
}
