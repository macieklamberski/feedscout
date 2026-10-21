import { describe, expect, it } from 'bun:test'
import {
  getXenforoPage,
  isXenforoHtml,
  parseXenforoUrl,
  type XenforoPage,
  type XenforoUrl,
  xenforoHandler,
} from './xenforo.js'

const xenforoHtml = '<html id="XF" lang="en-US" data-xf="2.3" data-app="public">'
const legacyHtml = '<html id="XenForo" lang="en-US">'
const otherHtml = '<html lang="en"><body id="phpbb">'

describe('isXenforoHtml', () => {
  it('should return true for the XenForo 2 app root', () => {
    expect(isXenforoHtml(xenforoHtml)).toBe(true)
  })

  it('should return true for the XenForo 1 app root', () => {
    expect(isXenforoHtml(legacyHtml)).toBe(true)
  })

  it('should return true for a single-quoted app root id', () => {
    expect(isXenforoHtml("<html id='XF'>")).toBe(true)
  })

  it('should return false for the app root id on an element other than html', () => {
    const value = '<html lang="en"><body><div id="XF"></div></body></html>'

    expect(isXenforoHtml(value)).toBe(false)
  })

  it('should return false for another forum platform', () => {
    expect(isXenforoHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isXenforoHtml('')).toBe(false)
  })
})

describe('parseXenforoUrl', () => {
  it('should return the forum for a short forum route', () => {
    const expected: XenforoUrl = { kind: 'forum', basePath: '', route: 'f', forumPath: 'general.2' }

    expect(parseXenforoUrl('https://forum.example/f/general.2/')).toEqual(expected)
  })

  it('should return the forum with a canonical route for a capitalized one', () => {
    const expected: XenforoUrl = {
      kind: 'forum',
      basePath: '',
      route: 'forums',
      forumPath: 'general.2',
    }

    expect(parseXenforoUrl('https://forum.example/Forums/general.2/')).toEqual(expected)
  })

  it('should return the forum with the sub-path the board is mounted under', () => {
    const expected: XenforoUrl = {
      kind: 'forum',
      basePath: '/community',
      route: 'forums',
      forumPath: 'general.2',
    }

    expect(parseXenforoUrl('https://forum.example/community/forums/general.2/')).toEqual(expected)
  })

  it('should return the board for another page', () => {
    const expected: XenforoUrl = { kind: 'board' }

    expect(parseXenforoUrl('https://forum.example/threads/hello.5/')).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseXenforoUrl('not-a-url')).toBeUndefined()
  })
})

describe('getXenforoPage', () => {
  const configHtml = `<script>XF.config = { basePath: '/community/', url: { fullBase: '' } }</script>`

  it('should return the forum from the url', () => {
    const value = 'https://example.com/community/forums/news.12/'
    const expected: XenforoPage = {
      kind: 'forum',
      basePath: '/community',
      route: 'forums',
      forumPath: 'news.12',
    }

    expect(getXenforoPage(value, configHtml)).toEqual(expected)
  })

  it('should return the base path the config prints for a board page', () => {
    const value = 'https://example.com/community/whats-new/'
    const expected: XenforoPage = { kind: 'board', basePath: '/community' }

    expect(getXenforoPage(value, configHtml)).toEqual(expected)
  })

  it('should return an empty base path for a board page without content', () => {
    const expected: XenforoPage = { kind: 'board', basePath: '' }

    expect(getXenforoPage('https://example.com/community/', undefined)).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(getXenforoPage('not-a-url', configHtml)).toBeUndefined()
  })

  it('should return an empty base path when the config path does not hold the page', () => {
    const expected: XenforoPage = { kind: 'board', basePath: '' }

    expect(getXenforoPage('https://example.com/whats-new/', configHtml)).toEqual(expected)
  })
})

describe('xenforoHandler', () => {
  describe('match', () => {
    it('should match a forum page', () => {
      expect(xenforoHandler.match('https://example.com/f/general.17/', xenforoHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(xenforoHandler.match('https://example.com/f/general.17/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(xenforoHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the feeds under the sub-path the board is mounted under', () => {
      const value = 'https://forum.example/community/forums/general.2/'
      const expected = [
        {
          uri: 'https://forum.example/community/forums/general.2/index.rss',
          hint: { key: 'xenforo:forum', label: 'Forum' },
        },
        {
          uri: 'https://forum.example/community/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum feed for a capitalized f segment', () => {
      const value = 'https://example.com/F/general.17/'
      const expected = [
        {
          uri: 'https://example.com/f/general.17/index.rss',
          hint: { key: 'xenforo:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.com/f/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum and site feeds for a forum path', () => {
      const value = 'https://example.com/f/general.17/'
      const expected = [
        {
          uri: 'https://example.com/f/general.17/index.rss',
          hint: { key: 'xenforo:forum', label: 'Forum' },
        },
        { uri: 'https://example.com/f/-/index.rss', hint: { key: 'xenforo:site', label: 'Site' } },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum and site feeds for a forum on the default route', () => {
      const value = 'https://example.com/forums/general.17/'
      const expected = [
        {
          uri: 'https://example.com/forums/general.17/index.rss',
          hint: { key: 'xenforo:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.com/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the site feeds when the forum id runs into letters', () => {
      const value = 'https://example.com/forums/general.17x/'
      const expected = [
        {
          uri: 'https://example.com/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
        { uri: 'https://example.com/f/-/index.rss', hint: { key: 'xenforo:site', label: 'Site' } },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the site feed on a thread page', () => {
      const value = 'https://example.com/threads/a-thread.123/'
      const expected = [
        {
          uri: 'https://example.com/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
        { uri: 'https://example.com/f/-/index.rss', hint: { key: 'xenforo:site', label: 'Site' } },
      ]

      expect(xenforoHandler.resolve(value)).toEqual(expected)
    })

    const subPathHtml = `${xenforoHtml}<script>XF.config = { url: { basePath: '/community/' } }</script>`
    const subPathExpected = [
      {
        uri: 'https://forum.example/community/forums/-/index.rss',
        hint: { key: 'xenforo:site', label: 'Site' },
      },
      {
        uri: 'https://forum.example/community/f/-/index.rss',
        hint: { key: 'xenforo:site', label: 'Site' },
      },
    ]
    const subPathValues: Array<string> = [
      'https://forum.example/community/',
      'https://forum.example/community',
      'https://forum.example/community/threads/a-thread.123/',
    ]

    it.each(subPathValues)(
      'should return the site feeds under the path the page names for %s',
      (value) => {
        expect(xenforoHandler.resolve(value, subPathHtml)).toEqual(subPathExpected)
      },
    )

    it('should return the site feeds on the origin when the named path does not hold the page', () => {
      const value = 'https://forum.example/threads/a-thread.123/'
      const expected = [
        {
          uri: 'https://forum.example/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
        {
          uri: 'https://forum.example/f/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
      ]

      expect(xenforoHandler.resolve(value, subPathHtml)).toEqual(expected)
    })

    it('should return the site feeds on the origin for a board at the root', () => {
      const value = 'https://forum.example/'
      const content = `${xenforoHtml}<script>XF.config = { url: { basePath: '/' } }</script>`
      const expected = [
        {
          uri: 'https://forum.example/forums/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
        {
          uri: 'https://forum.example/f/-/index.rss',
          hint: { key: 'xenforo:site', label: 'Site' },
        },
      ]

      expect(xenforoHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
