import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// InsaneJournal (an LJ-codebase fork) serves RSS and Atom per user at
// `{user}.insanejournal.com/data/{rss,atom}`, plus `/data/userpics` (Atom)
// and `?tag={tag}` filtering; asylums live at
// `asylums.insanejournal.com/{name}/data/...`. Only the base RSS and Atom
// are advertised via HTML `<link rel="alternate">`. The handler adds tag
// filters, the userpics feed, and canonicalises the `www/users/{u}`, `/~{u}`,
// `/asylum/{n}`, `/community/{n}` paths to the right subdomain form.

const wwwUsersPathRegex = /^\/(?:users\/|~)([^/]+)/
const wwwAsylumPathRegex = /^\/(?:asylum|community)\/([^/]+)/
const firstSegmentRegex = /^\/([^/]+)/
const tagRegex = /^\/tag\/([^/]+)/

export const insanejournalHandler: PlatformHandler = {
  match: (url) => {
    if (!isSubdomainOf(url, 'insanejournal.com')) {
      return false
    }

    const { hostname, pathname } = new URL(url)
    const lower = hostname.toLowerCase()

    if (lower === 'www.insanejournal.com' || lower === 'insanejournal.com') {
      return wwwUsersPathRegex.test(pathname) || wwwAsylumPathRegex.test(pathname)
    }

    if (lower === 'asylums.insanejournal.com' || lower === 'feeds.insanejournal.com') {
      return firstSegmentRegex.test(pathname)
    }

    return true
  },

  resolve: (url) => {
    const { origin, hostname, pathname } = new URL(url)
    const lowerHostname = hostname.toLowerCase()
    const uris: Array<DiscoverUriEntry> = []

    let feedOrigin = origin
    let feedPathPrefix = ''

    if (lowerHostname === 'www.insanejournal.com' || lowerHostname === 'insanejournal.com') {
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
    } else if (lowerHostname === 'asylums.insanejournal.com') {
      const segMatch = pathname.match(firstSegmentRegex)

      if (segMatch?.[1]) {
        feedPathPrefix = `/${segMatch[1]}`
      } else {
        return uris
      }
    } else if (lowerHostname === 'feeds.insanejournal.com') {
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
      const tag = encodeURIComponent(tagMatch[1])

      uris.push({
        uri: `${feedOrigin}${feedPathPrefix}/data/rss?tag=${tag}`,
        hint: composeHint('insanejournal:posts-tag-rss'),
      })
      uris.push({
        uri: `${feedOrigin}${feedPathPrefix}/data/atom?tag=${tag}`,
        hint: composeHint('insanejournal:posts-tag-atom'),
      })
    }

    uris.push({
      uri: `${feedOrigin}${feedPathPrefix}/data/rss`,
      hint: composeHint('insanejournal:posts-rss'),
    })
    uris.push({
      uri: `${feedOrigin}${feedPathPrefix}/data/atom`,
      hint: composeHint('insanejournal:posts-atom'),
    })
    uris.push({
      uri: `${feedOrigin}${feedPathPrefix}/data/userpics`,
      hint: composeHint('insanejournal:userpics-atom'),
    })

    return uris
  },
}
