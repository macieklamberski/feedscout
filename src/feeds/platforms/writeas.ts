import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type WriteasUrl =
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'blog'; username: string }

const hosts = ['write.as', 'www.write.as']

const tagRegex = /^\/([^/]+)\/tag:([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'writeas:tag', template: 'https://write.as/{username}/tag:{tag}/feed/' },
  { key: 'writeas:blog', template: 'https://write.as/{username}/feed/' },
])

export const parseWriteasUrl = (url: string): WriteasUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // Tag page: /{user}/tag:{tag}
  const tagMatch = parsedUrl.pathname.match(tagRegex)

  if (tagMatch?.[1] && tagMatch[2]) {
    return { kind: 'tag', username: tagMatch[1], tag: tagMatch[2] }
  }

  const [username] = getPathSegments(parsedUrl)

  // WriteFreely names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  return { kind: 'blog', username }
}

export const writeasHandler: PlatformHandler = {
  match: (url) => {
    return parseWriteasUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWriteasUrl(url)

    if (!parsed) {
      return []
    }

    const blogFeed = feeds.getFeedEntry('writeas:blog', { username: parsed.username })

    if (parsed.kind === 'tag') {
      const tagFeed = feeds.getFeedEntry('writeas:tag', {
        username: parsed.username,
        tag: parsed.tag,
      })

      return [tagFeed, blogFeed]
    }

    return [blogFeed]
  },

  // The table reads any first segment as a name, so a dotted one, a file of the site, is refused
  // by the page parser first: write.as/{post}.md/feed/ answers with an empty body.
  getFeedHint: (url) => {
    if (!parseWriteasUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
