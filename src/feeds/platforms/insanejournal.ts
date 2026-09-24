import { isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, decodePathSegment } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers asylum, blog, tildePath, userPath.
// Handler needed for: syndicated.

const wwwHosts = ['www.insanejournal.com', 'insanejournal.com']

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/
const wwwAsylumPathRegex = /^\/(?:asylum|community)\/([^/]+)/
const firstSegmentRegex = /^\/([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/

export const insanejournalHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'insanejournal.com')) {
      return false
    }

    const { pathname } = new URL(url)

    if (isHostOf(url, wwwHosts)) {
      return wwwUsersPathRegex.test(pathname) || wwwAsylumPathRegex.test(pathname)
    }

    if (isHostOf(url, ['asylums.insanejournal.com', 'feeds.insanejournal.com'])) {
      return firstSegmentRegex.test(pathname)
    }

    return true
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

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
          return uris
        }
      }
    } else if (isHostOf(url, 'asylums.insanejournal.com')) {
      const segMatch = pathname.match(firstSegmentRegex)

      if (segMatch?.[1]) {
        feedPathPrefix = `/${segMatch[1]}`
      } else {
        return uris
      }
    } else if (isHostOf(url, 'feeds.insanejournal.com')) {
      const segMatch = pathname.match(firstSegmentRegex)

      if (segMatch?.[1]) {
        feedPathPrefix = `/${segMatch[1]}`
      } else {
        return uris
      }
    }

    // Tag-filtered feeds for /tag/{tag} (only meaningful on personal journal subdomains
    // and asylum/feed sub-paths).
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = encodeURIComponent(decodePathSegment(tagMatch[1]))

      uris.push({
        uri: `${feedOrigin}${feedPathPrefix}/data/rss?tag=${tag}`,
        hint: composeHint('insanejournal:posts-tag', 'rss'),
      })
      uris.push({
        uri: `${feedOrigin}${feedPathPrefix}/data/atom?tag=${tag}`,
        hint: composeHint('insanejournal:posts-tag', 'atom'),
      })
    }

    uris.push({
      uri: `${feedOrigin}${feedPathPrefix}/data/rss`,
      hint: composeHint('insanejournal:posts', 'rss'),
    })
    uris.push({
      uri: `${feedOrigin}${feedPathPrefix}/data/atom`,
      hint: composeHint('insanejournal:posts', 'atom'),
    })
    uris.push({
      uri: `${feedOrigin}${feedPathPrefix}/data/userpics`,
      hint: composeHint('insanejournal:userpics', 'atom'),
    })

    return uris
  },
}
