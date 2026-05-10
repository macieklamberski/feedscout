import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Partially discoverable without handler.

export const hosts = ['dev.to', 'www.dev.to']
const userRegex = /^\/([a-zA-Z0-9_]+)\/?$/
const tagRegex = /^\/t\/([^/]+)/
export const excludedPaths = [
  'tag',
  'tags',
  'search',
  'top',
  'latest',
  'about',
  'contact',
  'privacy',
  'terms',
  'code-of-conduct',
  'faq',
  'enter',
  'settings',
  'signout-confirm',
  'notifications',
  'reading-list',
  'dashboard',
]

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Homepage: global community feed.
    if (pathname === '/' || pathname === '') {
      return [{ uri: 'https://dev.to/feed', hint: composeHint('devto:community') }]
    }

    // Latest sort: /latest.
    if (pathname === '/latest' || pathname === '/latest/') {
      return [{ uri: 'https://dev.to/feed/latest', hint: composeHint('devto:latest') }]
    }

    // User profile: /username.
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [{ uri: `https://dev.to/feed/${username}`, hint: composeHint('devto:posts') }]
      }
    }

    // Tag page: /t/tagname.
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [{ uri: `https://dev.to/feed/tag/${tag}`, hint: composeHint('devto:tag') }]
    }

    return []
  },
}
