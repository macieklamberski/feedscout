import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type BubblelifeUrl =
  | { kind: 'community'; community: string }
  | { kind: 'library'; community: string; libraryId: string }

const domains = ['bubblelife.com']

const communityRegex = /^\/community\/([a-z0-9_]+)(?:\/library\/(\d+))?(?:\/|$)/i
const feedHrefRegex = /^\/rss\?c=(\d+)$/

export const parseBubblelifeUrl = (url: string): BubblelifeUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const match = new URL(url).pathname.match(communityRegex)

  if (!match?.[1]) {
    return
  }

  if (match[2]) {
    return { kind: 'library', community: match[1], libraryId: match[2] }
  }

  return { kind: 'community', community: match[1] }
}

export const bubblelifeHandler: PlatformHandler = {
  match: (url) => {
    return parseBubblelifeUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseBubblelifeUrl(url)

    if (!parsed || !content) {
      return []
    }

    const { origin } = new URL(url)
    const communityPath = `/community/${parsed.community}/library/`

    // The rssinfo page links the feeds themselves, its "All Posts" feed first. Topic feeds carry
    // a `&t=` suffix and are left out.
    const feedLink = findElement(content, (element) => {
      return element.name === 'a' && feedHrefRegex.test(element.attribs.href ?? '')
    })
    const feedId = feedLink?.attribs.href?.match(feedHrefRegex)?.[1]

    if (feedId) {
      return [
        {
          uri: `${origin}/rss?c=${feedId}`,
          hint: composeHint(parsed.kind === 'library' ? 'bubblelife:library' : 'bubblelife:posts'),
        },
      ]
    }

    // A made-up library id answers 200 with the community's About page, whose footer RSS link
    // then names the community instead, so the id counts only when the footer names it.
    if (
      parsed.kind === 'library' &&
      content
        .toLowerCase()
        .includes(`${communityPath}${parsed.libraryId}/type/rssinfo`.toLowerCase())
    ) {
      return [
        {
          uri: `${origin}/rss?c=${parsed.libraryId}`,
          hint: composeHint('bubblelife:library'),
        },
      ]
    }

    // The page's alternate link has no href, so the id is read from the community's first library
    // link, which is its "All Posts" feed. A city news community links no library of its own.
    const libraryIdRegex = new RegExp(`href="${communityPath}(\\d+)["/]`, 'i')
    const libraryId = content.match(libraryIdRegex)?.[1]

    if (!libraryId) {
      return []
    }

    return [
      {
        uri: `${origin}/rss?c=${libraryId}`,
        hint: composeHint('bubblelife:posts'),
      },
    ]
  },
}
