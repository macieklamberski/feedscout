import { getSubdomain } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers archive, blog, photos, replies.

export type MicroblogUrl = { kind: 'blog'; username: string }

export const domains = ['micro.blog']

const categoryRegex = /^\/categories\/([^/]+)/i
const archiveRegex = /^\/archive(?:\/|$)/i
const photosRegex = /^\/photos(?:\/|$)/i
const repliesRegex = /^\/replies(?:\/|$)/i

export const parseMicroblogUrl = (url: string): MicroblogUrl | undefined => {
  const username = getSubdomain(url, domains)

  // Only {username}.micro.blog names a blog, www.micro.blog serves nothing.
  if (!username || username.includes('.') || username === 'www') {
    return
  }

  return { kind: 'blog', username }
}

export const microblogHandler: PlatformHandler = {
  match: (url) => {
    return parseMicroblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Category page: /categories/{slug}
    const categoryMatch = pathname.match(categoryRegex)

    if (categoryMatch?.[1]) {
      const category = categoryMatch[1]

      uris.push({
        uri: `${origin}/categories/${category}/feed.xml`,
        hint: composeHint('microblog:category', 'rss'),
      })
      uris.push({
        uri: `${origin}/categories/${category}/feed.json`,
        hint: composeHint('microblog:category', 'json'),
      })
    }

    // Archive page: /archive
    if (archiveRegex.test(pathname)) {
      uris.push({
        uri: `${origin}/archive/index.json`,
        hint: composeHint('microblog:archive'),
      })
    }

    // Photos page: /photos
    if (photosRegex.test(pathname)) {
      uris.push({
        uri: `${origin}/photos/index.json`,
        hint: composeHint('microblog:photos'),
      })
    }

    // Replies page: /replies
    if (repliesRegex.test(pathname)) {
      uris.push({
        uri: `${origin}/replies.xml`,
        hint: composeHint('microblog:replies'),
      })
    }

    // Always include main feeds.
    uris.push({ uri: `${origin}/feed.xml`, hint: composeHint('microblog:posts', 'rss') })
    uris.push({ uri: `${origin}/feed.json`, hint: composeHint('microblog:posts', 'json') })
    uris.push({ uri: `${origin}/podcast.xml`, hint: composeHint('microblog:podcast', 'rss') })
    uris.push({ uri: `${origin}/podcast.json`, hint: composeHint('microblog:podcast', 'json') })

    return uris
  },
}
