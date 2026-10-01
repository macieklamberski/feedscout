import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type Fc2Url = { kind: 'blog' }

const blogHostRegex = /\.blog\d*\.fc2\.com$/i

export const parseFc2Url = (url: string): Fc2Url | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !blogHostRegex.test(parsedUrl.hostname)) {
    return
  }

  return { kind: 'blog' }
}

export const fc2Handler: PlatformHandler = {
  match: (url) => {
    return parseFc2Url(url) !== undefined
  },

  resolve: (url) => {
    if (!parseFc2Url(url)) {
      return []
    }

    const { origin } = new URL(url)

    return [
      { uri: `${origin}/?xml`, hint: composeHint('fc2:posts') },
      { uri: `${origin}/?xml&comment`, hint: composeHint('fc2:comments') },
      { uri: `${origin}/?xml&trackback`, hint: composeHint('fc2:trackbacks') },
    ]
  },
}
