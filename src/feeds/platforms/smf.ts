import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers forum (html), partly covers board, topic.

const scriptUrlRegex = /var smf_scripturl = "([^"]+)"/
const boardIdRegex = /[?;&]board=(\d+)/

// Core prints both script variables in every page head whatever the theme, from SMF 1.1 to 2.1.
export const isSmfHtml = (content: string): boolean => {
  return scriptUrlRegex.test(content) && content.includes('var smf_theme_url = "')
}

// A board page and a topic page both link their board as `rel="index"`.
const getBoardId = (url: string, content: string): string | undefined => {
  const urlBoardId = url.match(boardIdRegex)?.[1]

  if (urlBoardId) {
    return urlBoardId
  }

  const indexLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'index'
  })

  return indexLink?.attribs.href?.match(boardIdRegex)?.[1]
}

export type SmfPage = { feedUrl: string; boardId?: string }

const getSmfPage = (url: string, content: string | undefined): SmfPage | undefined => {
  const scriptUrl = content?.match(scriptUrlRegex)?.[1]

  if (!content || !scriptUrl) {
    return
  }

  // A guest without cookies gets the script URL with a `PHPSESSID` query appended.
  const { origin, pathname } = new URL(scriptUrl, url)

  return { feedUrl: `${origin}${pathname}?action=.xml`, boardId: getBoardId(url, content) }
}

export const smfHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isSmfHtml })
  },

  resolve: (url, content) => {
    const page = getSmfPage(url, content)

    if (!page) {
      return []
    }

    const { feedUrl, boardId } = page
    const uris: Array<DiscoverUriEntry> = []

    if (boardId) {
      uris.push(
        { uri: `${feedUrl};type=rss2;board=${boardId}`, hint: composeHint('smf:board', 'rss') },
        { uri: `${feedUrl};type=atom;board=${boardId}`, hint: composeHint('smf:board', 'atom') },
      )
    }

    uris.push(
      { uri: `${feedUrl};type=rss2`, hint: composeHint('smf:posts', 'rss') },
      { uri: `${feedUrl};type=atom`, hint: composeHint('smf:posts', 'atom') },
    )

    return uris
  },
}
