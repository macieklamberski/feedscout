import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

const tagRegex = /^\/questions\/tagged\/([\w.+-]+)/
const questionRegex = /^\/questions\/(\d+)/
const userRegex = /^\/users\/(\d+)/

// Standalone domains from SE API: https://api.stackexchange.com/2.3/sites
const domains = [
  'stackoverflow.com',
  'serverfault.com',
  'superuser.com',
  'askubuntu.com',
  'stackapps.com',
  'mathoverflow.net',
  'stackexchange.com',
]

export const stackExchangeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, domains) || isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/tag/${tagMatch[1]}`,
          hint: composeHint('stackexchange:tag'),
        },
      ]
    }

    const questionMatch = pathname.match(questionRegex)

    if (questionMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/question/${questionMatch[1]}`,
          hint: composeHint('stackexchange:question'),
        },
      ]
    }

    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/user/${userMatch[1]}`,
          hint: composeHint('stackexchange:user'),
        },
      ]
    }

    return []
  },
}
