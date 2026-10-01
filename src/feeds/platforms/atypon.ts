import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

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
const wileyHost = 'onlinelibrary.wiley.com'

const journalRegex = /^\/(?:toc|journals?|loi|home)\/(\w+)(?:\/|$)/i

export const parseAtyponUrl = (url: string): AtyponUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { host, pathname } = new URL(url)
  const code = pathname.match(journalRegex)?.[1]

  if (!code) {
    return
  }

  return { kind: 'journal', code, isWiley: host === wileyHost }
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

    const { origin } = new URL(url)
    const uris = [
      {
        uri: `${origin}/action/showFeed?type=etoc&feed=rss&jc=${parsed.code}`,
        hint: composeHint('atypon:journal'),
      },
    ]

    if (parsed.isWiley) {
      uris.push({
        uri: `${origin}/feed/${parsed.code}/most-cited`,
        hint: composeHint('atypon:most-cited'),
      })
    }

    return uris
  },
}
