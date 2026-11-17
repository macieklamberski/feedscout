import { getPathSegments, includesAnyOf, isAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: tagged.
// Handler needed for: media, posts, replies, tag.

export type MastodonUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'replies'; username: string }
  | { kind: 'media'; username: string }
  | { kind: 'tagged'; username: string; tag: string }
  | { kind: 'tag'; tag: string }

// suffixes: Mastodon's own profile formats, .rss, a legacy .atom and the ActivityPub .json. A
// remote handle, @user@host.tld, holds dots, so only these suffixes are stripped.
const feedExtensionRegex = /\.(rss|atom|json)$/i

// Mastodon is self-hosted and known only by its page marker, so nothing in a feed URL names it and
// the table only builds.
const feeds = definePlatformFeeds([
  { key: 'mastodon:posts', main: '{root}/@{username}.rss' },
  { key: 'mastodon:replies', main: '{root}/@{username}/with_replies.rss' },
  { key: 'mastodon:media', main: '{root}/@{username}/media.rss' },
  { key: 'mastodon:tagged', main: '{root}/@{username}/tagged/{tag}.rss' },
  { key: 'mastodon:tag', main: '{root}/tags/{tag}.rss' },
])

// Current Mastodon serves no generator meta, so the `<div class="app-holder" id="mastodon">` app
// root is matched too. A bare `mastodon` id is a common social-link id on blogs.
export const isMastodonHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'generator', 'Mastodon')) {
    return true
  }

  const appRoot = findElement(content, (element) => {
    return element.name === 'div' && element.attribs.id === 'mastodon'
  })

  return hasClass(appRoot, 'app-holder')
}

export const isMastodonHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('server'), 'mastodon')
}

export const parseMastodonUrl = (url: string): MastodonUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // Mastodon serves a page's feed at the page path plus .rss, as in /@user.rss.
  const segments = getPathSegments(parsedUrl)
  const [routeOrHandle, nameOrRoute, tag] = segments.map((segment) =>
    segment.replace(feedExtensionRegex, ''),
  )

  if (isAnyOf(routeOrHandle, 'tags') && nameOrRoute) {
    return { kind: 'tag', tag: nameOrRoute }
  }

  // Mastodon serves the profile at /users/{user} too, without redirecting, unless HTML is
  // asked for.
  if (isAnyOf(routeOrHandle, 'users') && nameOrRoute) {
    return { kind: 'profile', username: nameOrRoute }
  }

  if (!routeOrHandle?.startsWith('@')) {
    return
  }

  const username = routeOrHandle.slice(1)

  if (!username) {
    return
  }

  if (isAnyOf(nameOrRoute, 'with_replies')) {
    return { kind: 'replies', username }
  }

  if (isAnyOf(nameOrRoute, 'media')) {
    return { kind: 'media', username }
  }

  if (isAnyOf(nameOrRoute, 'tagged') && tag) {
    return { kind: 'tagged', username, tag }
  }

  return { kind: 'profile', username }
}

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseMastodonUrl(url)) {
      return false
    }

    return hasMarker(content, headers, { html: isMastodonHtml, headers: isMastodonHeaders })
  },

  resolve: (url) => {
    const parsed = parseMastodonUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'replies') {
      return [
        pageFeeds.getFeedEntry('mastodon:replies', { username: parsed.username }),
        pageFeeds.getFeedEntry('mastodon:posts', { username: parsed.username }),
      ]
    }

    if (parsed.kind === 'media') {
      return [
        pageFeeds.getFeedEntry('mastodon:media', { username: parsed.username }),
        pageFeeds.getFeedEntry('mastodon:posts', { username: parsed.username }),
      ]
    }

    if (parsed.kind === 'tagged') {
      return [
        pageFeeds.getFeedEntry('mastodon:tagged', { username: parsed.username, tag: parsed.tag }),
        pageFeeds.getFeedEntry('mastodon:posts', { username: parsed.username }),
      ]
    }

    if (parsed.kind === 'profile') {
      return [pageFeeds.getFeedEntry('mastodon:posts', { username: parsed.username })]
    }

    return [pageFeeds.getFeedEntry('mastodon:tag', { tag: parsed.tag })]
  },
}
