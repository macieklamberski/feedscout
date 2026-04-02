import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

const tagPattern = /^\/questions\/tagged\/([\w.+-]+)/
const questionPattern = /^\/questions\/(\d+)/
const userPattern = /^\/users\/(\d+)/

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

    const tagMatch = pathname.match(tagPattern)

    if (tagMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/tag/${tagMatch[1]}`,
          hint: composeHint('stackexchange:tag'),
        },
      ]
    }

    const questionMatch = pathname.match(questionPattern)

    if (questionMatch?.[1]) {
      return [
        {
          uri: `${origin}/feeds/question/${questionMatch[1]}`,
          hint: composeHint('stackexchange:question'),
        },
      ]
    }

    const userMatch = pathname.match(userPattern)

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
