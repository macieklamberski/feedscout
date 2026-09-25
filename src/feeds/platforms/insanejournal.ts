import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJournalFeeds } from './livejournal.js'

// Discoverability: Partially discoverable without handler.
// Generic covers asylum (html), partly covers blog, tildePath, userPath.
// Handler needed for: syndicated.

const domains = ['insanejournal.com']
const wwwHosts = ['www.insanejournal.com', 'insanejournal.com']
const asylumHosts = ['asylums.insanejournal.com']
const feedHosts = ['feeds.insanejournal.com']

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/
const wwwAsylumPathRegex = /^\/(?:asylum|community)\/([^/]+)/
const firstSegmentRegex = /^\/([^/]+)/

export const insanejournalHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, domains)) {
      return false
    }

    const { pathname } = new URL(url)

    if (isHostOf(url, wwwHosts)) {
      return wwwUsersPathRegex.test(pathname) || wwwAsylumPathRegex.test(pathname)
    }

    if (isHostOf(url, [...asylumHosts, ...feedHosts])) {
      return firstSegmentRegex.test(pathname)
    }

    return true
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    let feedOrigin = origin
    let feedPathPrefix = ''

    if (isHostOf(url, wwwHosts)) {
      const userMatch = pathname.match(wwwUsersPathRegex)

      if (userMatch?.[1]) {
        feedOrigin = `https://${userMatch[1]}.insanejournal.com`
      } else {
        const asylumMatch = pathname.match(wwwAsylumPathRegex)

        if (asylumMatch?.[1]) {
          feedOrigin = 'https://asylums.insanejournal.com'
          feedPathPrefix = `/${asylumMatch[1]}`
        } else {
          return []
        }
      }
    } else if (isHostOf(url, asylumHosts)) {
      const segMatch = pathname.match(firstSegmentRegex)

      if (segMatch?.[1]) {
        feedPathPrefix = `/${segMatch[1]}`
      } else {
        return []
      }
    } else if (isHostOf(url, feedHosts)) {
      const segMatch = pathname.match(firstSegmentRegex)

      if (segMatch?.[1]) {
        feedPathPrefix = `/${segMatch[1]}`
      } else {
        return []
      }
    }

    return getJournalFeeds(`${feedOrigin}${feedPathPrefix}`, pathname, 'insanejournal')
  },
}
