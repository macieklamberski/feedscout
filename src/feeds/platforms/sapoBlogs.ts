import { decodeSegment, getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, post, tag.

export type SapoBlogsUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }
  | { kind: 'tag'; blog: string; tag: string }

const domains = ['blogs.sapo.pt']
const commentsUrl = 'https://blogs.sapo.pt/commentsrss.bml'

const postRegex = /^\/(?:[^/]+-(\d+)|(\d+)\.html)\/?$/i
const tagRegex = /^\/tag\/(.+?)\/?$/i
const reservedCharRegex = /[!'()*]/g

// The m host is the mobile front on its own server and www serves no blog.
const excludedSubdomains = ['m', 'www']

export const parseSapoBlogsUrl = (url: string): SapoBlogsUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  const blog = getSubdomain(url, domains)

  // The certificate covers one label, so a dotted subdomain such as www.{blog} names no blog.
  if (!pathname || !blog || blog.includes('.') || isAnyOf(blog, excludedSubdomains)) {
    return
  }

  const postMatch = pathname.match(postRegex)
  const postId = postMatch?.[1] ?? postMatch?.[2]

  if (postId) {
    return { kind: 'post', blog, postId }
  }

  // Tag paths spell a space as a plus.
  const tag = decodeSegment(pathname.match(tagRegex)?.[1]?.replaceAll('+', ' '))

  if (tag) {
    return { kind: 'tag', blog, tag }
  }

  return { kind: 'blog', blog }
}

export const sapoBlogsHandler: PlatformHandler = {
  match: (url) => {
    return parseSapoBlogsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseSapoBlogsUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'post') {
      const postLinkRegex = new RegExp(`ditemid=${parsed.postId}(?!\\d)`)

      // The endpoint answers an empty channel for a made-up post id, so only a linked post counts.
      if (postLinkRegex.test(content ?? '')) {
        uris.push({
          uri: `${commentsUrl}?blog=${parsed.blog}&ditemid=${parsed.postId}`,
          hint: composeHint('sapo-blogs:post-comments'),
        })
      }
    }

    if (parsed.kind === 'tag') {
      // The page escapes !'()* in the tag, which encodeURIComponent leaves as they are.
      const tag = encodeURIComponent(parsed.tag).replace(reservedCharRegex, (char) => {
        return `%${char.charCodeAt(0).toString(16).toUpperCase()}`
      })

      uris.push({
        uri: `${origin}/data/rss?tag=${tag}`,
        hint: composeHint('sapo-blogs:tag'),
      })
    }

    uris.push({ uri: `${origin}/data/rss`, hint: composeHint('sapo-blogs:posts', 'rss') })
    uris.push({ uri: `${origin}/data/atom`, hint: composeHint('sapo-blogs:posts', 'atom') })
    uris.push({
      uri: `${commentsUrl}?blog=${parsed.blog}`,
      hint: composeHint('sapo-blogs:comments'),
    })

    return uris
  },
}
