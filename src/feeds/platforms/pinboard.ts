import { pinboard } from 'feedintel'
import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: bookmarks, popular, recent, user-tag.

export type PinboardUrl =
  | { kind: 'userTag'; username: string; tags: Array<string> }
  | { kind: 'userSource'; username: string; tags: Array<string>; source: string }
  | { kind: 'user'; username: string }
  | { kind: 'tag'; tags: Array<string> }
  | { kind: 'recent' }
  | { kind: 'popular' }

const hosts = pinboard.hosts.exact

const userRegex = /^u:(.+)$/i
const tagRegex = /^t:(.+)$/i
const sourceRegex = /^from:(.+)$/i
const recentRegex = /^\/recent\/?$/i

const feeds = withHintLabels(pinboard.feeds)

const joinTags = (tags: Array<string>): string => {
  return tags.join('/t:')
}

export const parsePinboardUrl = (url: string): PinboardUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [first, ...rest] = getPathSegments(parsedUrl)
  const username = first?.match(userRegex)?.[1]

  // User bookmarks, narrowed by one or more tags: /u:{user}/t:{tag}/t:{tag}/.
  if (username) {
    const tags: Array<string> = []
    let source: string | undefined

    for (const segment of rest) {
      const tag = tagRegex.exec(segment)?.[1]

      if (tag) {
        tags.push(tag)
      }

      source = sourceRegex.exec(segment)?.[1] ?? source
    }

    if (source) {
      return { kind: 'userSource', username, tags, source }
    }

    if (tags.length > 0) {
      return { kind: 'userTag', username, tags }
    }

    return { kind: 'user', username }
  }

  // Site-wide tag page: /t:{tag}/, where every segment is a tag.
  const siteTags = [first, ...rest].map((segment) => segment?.match(tagRegex)?.[1])

  if (siteTags.length > 0 && siteTags.every(Boolean)) {
    return { kind: 'tag', tags: siteTags.filter((tag) => tag !== undefined) }
  }

  if (recentRegex.test(parsedUrl.pathname)) {
    return { kind: 'recent' }
  }

  return { kind: 'popular' }
}

export const pinboardHandler: PlatformHandler = {
  match: (url) => {
    return parsePinboardUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePinboardUrl(url)

    if (!parsed) {
      return []
    }

    // The recent and popular lists need no value from the page, so every page builds them after its
    // own feeds.
    if (parsed.kind === 'userTag') {
      return [
        feeds.getFeedEntry('user-tag', {
          username: parsed.username,
          tags: joinTags(parsed.tags),
        }),
        feeds.getFeedEntry('recent'),
        feeds.getFeedEntry('popular'),
      ]
    }

    if (parsed.kind === 'userSource') {
      return [
        feeds.getFeedEntry('source', {
          username: parsed.username,
          tags: joinTags(parsed.tags),
          source: parsed.source,
        }),
        feeds.getFeedEntry('recent'),
        feeds.getFeedEntry('popular'),
      ]
    }

    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('bookmarks', { username: parsed.username }),
        feeds.getFeedEntry('recent'),
        feeds.getFeedEntry('popular'),
      ]
    }

    // It answered 500 on 2026-09-26 while Pinboard's search backend was down, and validation
    // drops it until the backend is back.
    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tags: joinTags(parsed.tags) }),
        feeds.getFeedEntry('recent'),
        feeds.getFeedEntry('popular'),
      ]
    }

    if (parsed.kind === 'recent') {
      return [feeds.getFeedEntry('recent'), feeds.getFeedEntry('popular')]
    }

    return [feeds.getFeedEntry('popular'), feeds.getFeedEntry('recent')]
  },

  getFeedHint: feeds.getFeedHint,
}
