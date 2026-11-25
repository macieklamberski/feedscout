import { isProgrammer } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: comments, messages, posts, site.
// Handler needed for: post-comments.

export type IsProgrammerUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }

// An unregistered name answers the sign-up page, served from the platform's own index account.
const signUpPageRegex = /\/user_files\/index\/config\/favicon\.ico"/i

const feeds = withHintLabels(isProgrammer.feeds)

export const parseIsProgrammerUrl = (url: string): IsProgrammerUrl | undefined => {
  // A deeper host such as www.{blog}.is-programmer.com answers the sign-up page.
  const page = isProgrammer.pages.readUrl(url)

  if (!page) {
    return
  }

  const { blog } = page.values

  if (page.key === 'post') {
    return { kind: 'post', blog, postId: page.values.postId }
  }

  return { kind: 'blog', blog }
}

export const isProgrammerHandler: PlatformHandler = {
  match: (url, content) => {
    if (content && signUpPageRegex.test(content)) {
      return false
    }

    return parseIsProgrammerUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseIsProgrammerUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'post') {
      return [
        page.getFeedEntry('post-comments', { postId: parsed.postId }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('comments'),
        page.getFeedEntry('messages'),
        page.getFeedEntry('site'),
      ]
    }

    return [
      page.getFeedEntry('posts'),
      page.getFeedEntry('comments'),
      page.getFeedEntry('messages'),
      page.getFeedEntry('site'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
