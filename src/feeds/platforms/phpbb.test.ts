import { describe, expect, it } from 'bun:test'
import { isPresent } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isPhpbbHtml, phpbbHandler } from './phpbb.js'

const phpbbHtml = '<body id="phpbb" class="section-index">'
const otherHtml = '<body id="XF">'

describe('isPhpbbHtml', () => {
  it('should return true for the phpBB body id', () => {
    expect(isPhpbbHtml(phpbbHtml)).toBe(true)
  })

  it('should return false for a Forumotion page on its phpBB3 template', () => {
    const value = '<div id="phpbb"></div><script>_userdata["session_logged_in"] = 0;</script>'

    expect(isPhpbbHtml(value)).toBe(false)
  })

  it('should return true for an unquoted phpBB body id', () => {
    expect(isPhpbbHtml('<body id=phpbb>')).toBe(true)
  })

  it('should return false for another forum platform', () => {
    expect(isPhpbbHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPhpbbHtml('')).toBe(false)
  })
})

describe('phpbbHandler', () => {
  describe('match', () => {
    it('should match a phpBB page', () => {
      expect(phpbbHandler.match('https://example.com/community/', phpbbHtml)).toBe(true)
    })

    it('should match a themed board by its session cookies', () => {
      const value = 'https://example.com/community/'
      const headers = new Headers()
      headers.append('set-cookie', 'phpbb3_7ybyg_can_u=1; path=/')
      headers.append('set-cookie', 'phpbb3_7ybyg_can_k=; path=/')
      headers.append('set-cookie', 'phpbb3_7ybyg_can_sid=abc; path=/')

      expect(phpbbHandler.match(value, '<html></html>', headers)).toBe(true)
    })

    it('should not match a lone session id cookie', () => {
      const value = 'https://example.com/community/'
      const headers = new Headers({ 'set-cookie': 'app_sid=abc; path=/' })

      expect(phpbbHandler.match(value, '<html></html>', headers)).toBe(false)
    })

    it('should not match without content', () => {
      expect(phpbbHandler.match('https://example.com/community/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(phpbbHandler.resolve('not-a-url')).toEqual([])
    })

    const getBoardFeeds = (boardUrl: string): Array<DiscoverUriEntry> => {
      return [
        { uri: `${boardUrl}/feed.php`, hint: { key: 'phpbb:site', label: 'Site' } },
        { uri: `${boardUrl}/feed.php?mode=news`, hint: { key: 'phpbb:news', label: 'News' } },
        {
          uri: `${boardUrl}/feed.php?mode=topics`,
          hint: { key: 'phpbb:new-topics', label: 'New topics' },
        },
        {
          uri: `${boardUrl}/feed.php?mode=topics_active`,
          hint: { key: 'phpbb:active-topics', label: 'Active topics' },
        },
        { uri: `${boardUrl}/feed.php?mode=forums`, hint: { key: 'phpbb:forums', label: 'Forums' } },
      ]
    }

    it('should build the board feeds from a board mounted under a sub-path', async () => {
      const entries = await phpbbHandler.resolve('https://example.com/community/')

      expect(entries.filter(isPresent)).toEqual(getBoardFeeds('https://example.com/community'))
    })

    it('should drop the script segment and add the forum feed', async () => {
      const value = 'https://example.com/community/viewforum.php?f=12'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?f=12',
          hint: { key: 'phpbb:forum', label: 'Forum' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should add the topic feed before the forum feed', () => {
      const value = 'https://example.com/community/viewtopic.php?f=12&t=345'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?t=345',
          hint: { key: 'phpbb:topic', label: 'Topic' },
        },
        {
          uri: 'https://example.com/community/feed.php?f=12',
          hint: { key: 'phpbb:forum', label: 'Forum' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]

      expect(phpbbHandler.resolve(value)).toEqual(expected)
    })

    it('should drop the script segment and add the forum feed with a capitalized viewforum segment', async () => {
      const value = 'https://example.com/community/VIEWFORUM.PHP?f=12'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?f=12',
          hint: { key: 'phpbb:forum', label: 'Forum' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should read the forum id name in uppercase', async () => {
      const value = 'https://example.com/community/viewforum.php?F=12'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?f=12',
          hint: { key: 'phpbb:forum', label: 'Forum' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should read the topic id name in uppercase', async () => {
      const value = 'https://example.com/community/viewtopic.php?T=345'
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?t=345',
          hint: { key: 'phpbb:topic', label: 'Topic' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should read the topic from the canonical link of a post link', async () => {
      const value = 'https://example.com/community/viewtopic.php?p=678'
      const content = `
        <link
          rel="canonical"
          href="https://example.com/community/viewtopic.php?t=345"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?t=345',
          hint: { key: 'phpbb:topic', label: 'Topic' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value, content)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should read the topic from a relative canonical link', async () => {
      const value = 'https://example.com/community/viewtopic.php?p=678'
      const content = `
        <link
          rel="canonical"
          href="./viewtopic.php?t=345"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?t=345',
          hint: { key: 'phpbb:topic', label: 'Topic' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value, content)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should prefer the topic in the url over the canonical link', async () => {
      const value = 'https://example.com/community/viewtopic.php?t=345'
      const content = `
        <link
          rel="canonical"
          href="https://example.com/community/viewtopic.php?t=999"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?t=345',
          hint: { key: 'phpbb:topic', label: 'Topic' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value, content)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should give the board feeds for a forum id with a letter', async () => {
      const value = 'https://example.com/community/viewforum.php?f=12abc'
      const entries = await phpbbHandler.resolve(value)

      expect(entries.filter(isPresent)).toEqual(getBoardFeeds('https://example.com/community'))
    })

    it('should read the canonical link when the topic id in the url has a letter', async () => {
      const value = 'https://example.com/community/viewtopic.php?t=345abc'
      const content = `
        <link
          rel="canonical"
          href="https://example.com/community/viewtopic.php?t=999"
        >
      `
      const expected = [
        {
          uri: 'https://example.com/community/feed.php?t=999',
          hint: { key: 'phpbb:topic', label: 'Topic' },
        },
        ...getBoardFeeds('https://example.com/community'),
      ]
      const entries = await phpbbHandler.resolve(value, content)

      expect(entries.filter(isPresent)).toEqual(expected)
    })

    it('should give the board feeds for a post link without a canonical link', async () => {
      const value = 'https://example.com/community/viewtopic.php?p=678'
      const entries = await phpbbHandler.resolve(value, '<html></html>')

      expect(entries.filter(isPresent)).toEqual(getBoardFeeds('https://example.com/community'))
    })

    it('should handle a board at the origin root', async () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://example.com/feed.php', hint: { key: 'phpbb:site', label: 'Site' } },
        {
          uri: 'https://example.com/feed.php?mode=news',
          hint: { key: 'phpbb:news', label: 'News' },
        },
        {
          uri: 'https://example.com/feed.php?mode=topics',
          hint: { key: 'phpbb:new-topics', label: 'New topics' },
        },
        {
          uri: 'https://example.com/feed.php?mode=topics_active',
          hint: { key: 'phpbb:active-topics', label: 'Active topics' },
        },
        {
          uri: 'https://example.com/feed.php?mode=forums',
          hint: { key: 'phpbb:forums', label: 'Forums' },
        },
      ]
      const entries = await phpbbHandler.resolve('https://example.com/')

      expect(entries.filter(isPresent)).toEqual(expected)
    })
  })
})
