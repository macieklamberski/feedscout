import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasElementWithId } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers board, forum, topic.

const scriptSegmentRegex = /\/[^/]*$/
const forumPathRegex = /\/viewforum\.php$/
const topicPathRegex = /\/viewtopic\.php$/

// Each id of a pair alone is a plausible id on an unrelated page.
const templateIds = ['brdheader', 'brdmain']
// `header.php` and `footer.php` print these whatever template the board uses.
const coreIds = ['brdmenu', 'brdfooter']

export const isFluxbbHtml = (content: string): boolean => {
  return (
    templateIds.every((id) => hasElementWithId(content, id)) ||
    coreIds.every((id) => hasElementWithId(content, id))
  )
}

export const fluxbbHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isFluxbbHtml(content ?? '')
  },

  resolve: (url) => {
    const { origin, pathname, searchParams } = new URL(url)
    const feedUrl = `${origin}${pathname.replace(scriptSegmentRegex, '')}/extern.php?action=feed`
    const id = searchParams.get('id')
    const uris: Array<DiscoverUriEntry> = []

    if (id && forumPathRegex.test(pathname)) {
      uris.push({ uri: `${feedUrl}&fid=${id}&type=atom`, hint: composeHint('fluxbb:forum') })
    }

    if (id && topicPathRegex.test(pathname)) {
      uris.push({ uri: `${feedUrl}&tid=${id}&type=atom`, hint: composeHint('fluxbb:topic') })
    }

    uris.push(
      { uri: `${feedUrl}&type=RSS`, hint: composeHint('fluxbb:posts', 'rss') },
      { uri: `${feedUrl}&type=atom`, hint: composeHint('fluxbb:posts', 'atom') },
    )

    return uris
  },
}
