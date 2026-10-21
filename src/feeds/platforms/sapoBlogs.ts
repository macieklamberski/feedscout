import { decodeSegment, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, post, tag.

export type SapoBlogsUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }
  | { kind: 'tag'; blog: string; tag: string }
export type SapoBlogsPage = SapoBlogsUrl

const domains = ['blogs.sapo.pt']
const commentsUrl = 'https://blogs.sapo.pt/commentsrss.bml'

const postRegex = /^\/(?:[^/]+-(\d+)|(\d+)\.html)\/?$/i
const tagRegex = /^\/tag\/(.+?)\/?$/i
const reservedCharRegex = /[!'()*]/g

export const parseSapoBlogsUrl = (url: string): SapoBlogsUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  const blog = getTenantSubdomain(url, domains)

  if (!pathname || !blog) {
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

export const getSapoBlogsPage = (
  url: string,
  content: string | undefined,
): SapoBlogsPage | undefined => {
  const parsed = parseSapoBlogsUrl(url)

  if (parsed?.kind !== 'post') {
    return parsed
  }

  const postLinkRegex = new RegExp(`ditemid=${parsed.postId}(?!\\d)`)

  // The endpoint answers an empty channel for a made-up post id, so only a linked post counts.
  if (!postLinkRegex.test(content ?? '')) {
    return { kind: 'blog', blog: parsed.blog }
  }

  return parsed
}

export const sapoBlogsHandler: PlatformHandler = {
  match: (url) => {
    return parseSapoBlogsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSapoBlogsPage(url, content)

    if (!page) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'post') {
      uris.push({
        uri: `${commentsUrl}?blog=${page.blog}&ditemid=${page.postId}`,
        hint: composeHint('sapo-blogs:post-comments'),
      })
    }

    if (page.kind === 'tag') {
      // The page escapes !'()* in the tag, which encodeURIComponent leaves as they are.
      const tag = encodeURIComponent(page.tag).replace(reservedCharRegex, (char) => {
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
      uri: `${commentsUrl}?blog=${page.blog}`,
      hint: composeHint('sapo-blogs:comments'),
    })

    return uris
  },
}
