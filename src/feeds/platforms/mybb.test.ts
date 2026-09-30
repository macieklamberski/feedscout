import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isMybbHeaders, isMybbHtml, mybbHandler } from './mybb.js'

const mybbHtml = `
  <script>
    var cookieDomain = ".example.com";
    var cookiePath = "/community/";
    var cookiePrefix = "";
    var rootpath = "https://example.com/community";
  </script>
`
const boardFeeds: Array<DiscoverUriEntry> = [
  {
    uri: 'https://example.com/community/syndication.php',
    hint: { key: 'mybb:threads', label: 'Threads', format: 'rss' },
  },
  {
    uri: 'https://example.com/community/syndication.php?type=atom1.0',
    hint: { key: 'mybb:threads', label: 'Threads', format: 'atom' },
  },
]
const forumFeeds: Array<DiscoverUriEntry> = [
  {
    uri: 'https://example.com/community/syndication.php?fid=12',
    hint: { key: 'mybb:forum', label: 'Forum', format: 'rss' },
  },
  {
    uri: 'https://example.com/community/syndication.php?type=atom1.0&fid=12',
    hint: { key: 'mybb:forum', label: 'Forum', format: 'atom' },
  },
]

describe('isMybbHeaders', () => {
  it('should return true for the last visit cookie', () => {
    const headers = new Headers({ 'set-cookie': 'mybb[lastvisit]=1790000000; path=/' })

    expect(isMybbHeaders(headers)).toBe(true)
  })

  it('should return true for the last visit cookie under a cookie prefix', () => {
    const headers = new Headers({ 'set-cookie': 'board_mybb[lastvisit]=1790000000; path=/' })

    expect(isMybbHeaders(headers)).toBe(true)
  })

  it('should return false for a lone session id cookie', () => {
    const headers = new Headers({ 'set-cookie': 'sid=abc; path=/' })

    expect(isMybbHeaders(headers)).toBe(false)
  })
})

describe('isMybbHtml', () => {
  it('should return true for the header script variables', () => {
    expect(isMybbHtml(mybbHtml)).toBe(true)
  })

  it('should return false for a cookie prefix variable alone', () => {
    expect(isMybbHtml('<script>var cookiePrefix = "";</script>')).toBe(false)
  })
})

describe('mybbHandler', () => {
  describe('match', () => {
    it('should match a MyBB page', () => {
      expect(mybbHandler.match('https://example.com/community/', mybbHtml)).toBe(true)
    })

    it('should match a MyBB board by its cookies', () => {
      const headers = new Headers({ 'set-cookie': 'mybb[lastvisit]=1790000000; path=/' })

      expect(mybbHandler.match('https://example.com/', '<html></html>', headers)).toBe(true)
    })

    it('should not match another page', () => {
      expect(mybbHandler.match('https://example.com/', '<html></html>', new Headers())).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should build the board feeds from the root path', () => {
      const value = 'https://example.com/community/index.php'

      expect(mybbHandler.resolve(value, mybbHtml)).toEqual(boardFeeds)
    })

    it('should build the board feeds from the page directory without a root path', () => {
      const value = 'https://example.com/community/index.php'

      expect(mybbHandler.resolve(value)).toEqual(boardFeeds)
    })

    it('should add the forum feeds on a forum page', () => {
      const value = 'https://example.com/community/forumdisplay.php?fid=12'

      expect(mybbHandler.resolve(value, mybbHtml)).toEqual([...forumFeeds, ...boardFeeds])
    })

    it('should add the forum feeds on a search engine friendly forum page', () => {
      const value = 'https://example.com/community/forum-12-page-2.html'

      expect(mybbHandler.resolve(value, mybbHtml)).toEqual([...forumFeeds, ...boardFeeds])
    })

    it('should ignore a forum page without a numeric forum id', () => {
      const value = 'https://example.com/community/forumdisplay.php?fid=news'

      expect(mybbHandler.resolve(value, mybbHtml)).toEqual(boardFeeds)
    })

    it('should read the forum from the last breadcrumb forum on a thread page', () => {
      const value = 'https://example.com/community/showthread.php?tid=345'
      const content = `
        ${mybbHtml}
        <div class="navigation">
          <a href="https://example.com/community/index.php">Community</a>
          <a href="forumdisplay.php?fid=1">General</a>
          <a href="forumdisplay.php?fid=12">News</a>
          <div class="pagination_breadcrumb">
            <a href="forumdisplay.php?fid=12&amp;page=2">2</a>
          </div>
          <span class="active">A thread</span>
        </div>
      `

      expect(mybbHandler.resolve(value, content)).toEqual([...forumFeeds, ...boardFeeds])
    })

    it('should read the forum from a search engine friendly breadcrumb', () => {
      const value = 'https://example.com/community/thread-345.html'
      const content = `
        ${mybbHtml}
        <div class="navigation">
          <a href="forum-12.html">News</a>
        </div>
      `

      expect(mybbHandler.resolve(value, content)).toEqual([...forumFeeds, ...boardFeeds])
    })

    it('should read the forum from an absolute breadcrumb link', () => {
      const value = 'https://example.com/community/showthread.php?tid=345'
      const content = `
        ${mybbHtml}
        <div class="navigation">
          <a href="https://example.com/community/forumdisplay.php?fid=12">News</a>
        </div>
      `

      expect(mybbHandler.resolve(value, content)).toEqual([...forumFeeds, ...boardFeeds])
    })

    it('should give the board feeds on a thread page without a breadcrumb', () => {
      const value = 'https://example.com/community/thread-345.html'

      expect(mybbHandler.resolve(value, mybbHtml)).toEqual(boardFeeds)
    })
  })
})
