import { getSubdomain, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers archive, blog, category, photos, replies.

export type MicroblogUrl =
  | { kind: 'category'; username: string; category: string }
  | { kind: 'archive'; username: string }
  | { kind: 'photos'; username: string }
  | { kind: 'replies'; username: string }
  | { kind: 'blog'; username: string }

export const domains = ['micro.blog']

const categoryRegex = /^\/categories\/([^/]+)/i
const archiveRegex = /^\/archive(?:\/|$)/i
const photosRegex = /^\/photos(?:\/|$)/i
const repliesRegex = /^\/replies(?:\/|$)/i

export const parseMicroblogUrl = (url: string): MicroblogUrl | undefined => {
  const parsedUrl = parseUrl(url)
  const username = getSubdomain(url, domains)

  // Only {username}.micro.blog names a blog, www.micro.blog serves nothing.
  if (!parsedUrl || !username || username.includes('.') || username === 'www') {
    return
  }

  const { pathname } = parsedUrl
  const category = pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', username, category }
  }

  if (archiveRegex.test(pathname)) {
    return { kind: 'archive', username }
  }

  if (photosRegex.test(pathname)) {
    return { kind: 'photos', username }
  }

  if (repliesRegex.test(pathname)) {
    return { kind: 'replies', username }
  }

  return { kind: 'blog', username }
}

export const microblogHandler: PlatformHandler = {
  match: (url) => {
    return parseMicroblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMicroblogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      // Micro.blog serves categories in lowercase only: /categories/Tech/feed.json answers 404
      // and /categories/Tech/feed.xml redirects to the blog's main feed.
      const category = parsed.category.toLowerCase()

      uris.push({
        uri: `${origin}/categories/${category}/feed.xml`,
        hint: composeHint('microblog:category', 'rss'),
      })
      uris.push({
        uri: `${origin}/categories/${category}/feed.json`,
        hint: composeHint('microblog:category', 'json'),
      })
    }

    if (parsed.kind === 'archive') {
      uris.push({ uri: `${origin}/archive/index.json`, hint: composeHint('microblog:archive') })
    }

    if (parsed.kind === 'photos') {
      uris.push({ uri: `${origin}/photos/index.json`, hint: composeHint('microblog:photos') })
    }

    if (parsed.kind === 'replies') {
      uris.push({ uri: `${origin}/replies.xml`, hint: composeHint('microblog:replies') })
    }

    uris.push({ uri: `${origin}/feed.xml`, hint: composeHint('microblog:posts', 'rss') })
    uris.push({ uri: `${origin}/feed.json`, hint: composeHint('microblog:posts', 'json') })
    uris.push({ uri: `${origin}/podcast.xml`, hint: composeHint('microblog:podcast', 'rss') })
    uris.push({ uri: `${origin}/podcast.json`, hint: composeHint('microblog:podcast', 'json') })

    return uris
  },
}
