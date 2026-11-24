import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  type GnuboardPage,
  getGnuboardPage,
  gnuboardHandler,
  isGnuboardHeaders,
} from './gnuboard.js'

const gnuboardHeaders = new Headers([
  ['set-cookie', 'PHPSESSID=3a1b7hmjt0s91h2qe96ucfj0vs; path=/; secure; HttpOnly'],
  [
    'set-cookie',
    'e1192aefb64683cc97abb83c71057733=YnVzaW5lc3M%3D; expires=Mon, 05-Oct-2026 07:49:34 GMT; Max-Age=86400; path=/',
  ],
  [
    'set-cookie',
    '2a0d2363701f23f8a75028924a3af643=MTE1Ljg3LjE1MS4xNzY%3D; expires=Mon, 05-Oct-2026 07:49:34 GMT; Max-Age=86400; path=/',
  ],
])
const otherHeaders = new Headers({
  'set-cookie': 'PHPSESSID=5lqskra3t0c2nlpd8shjaeah7s; path=/',
})
const boardHtml = `
  <script>
  var g5_url       = "https://www.wsgvet.com";
  var g5_bbs_url   = "https://www.wsgvet.com/bbs";
  var g5_is_member = "";
  var g5_bo_table  = "blog";
  </script>
`
const businessHtml = `
  <script>
  var g5_url       = "https://dete035.kr";
  var g5_bo_table  = "business";
  </script>
`
const subPathHtml = `
  <script>
  var g5_url       = "https://gospelschool.kr/g5";
  var g5_bo_table  = "reviews01";
  </script>
`
const gnuboard4Html = `
  <script type="text/javascript">
  var g4_path      = "..";
  var g4_bbs       = "bbs";
  var g4_url       = "http://ksum.org";
  var g4_bo_table  = "column_man";
  </script>
`
const homeHtml = `
  <script>
  var g5_url       = "http://gjcenter.kr";
  var g5_bo_table  = "";
  </script>
`
const missingBoardHtml = `
  <meta http-equiv="content-type" content="text/html; charset=euc-kr">
  <script language='javascript'>alert('존재하지 않는 게시판입니다.');</script>
`

describe('isGnuboardHeaders', () => {
  it('should return true for the visit cookie', () => {
    expect(isGnuboardHeaders(gnuboardHeaders)).toBe(true)
  })

  it('should return false for a plain PHP session', () => {
    expect(isGnuboardHeaders(otherHeaders)).toBe(false)
  })

  it('should return false for the cookie name in a value', () => {
    const value = new Headers({ 'set-cookie': 'seen=2a0d2363701f23f8a75028924a3af643; path=/' })

    expect(isGnuboardHeaders(value)).toBe(false)
  })
})

describe('getGnuboardPage', () => {
  it('should return the board of a Gnuboard 5 board page', () => {
    const value = 'https://dete035.kr/bbs/board.php?bo_table=business'
    const expected: GnuboardPage = { kind: 'board', root: '', board: 'business' }

    expect(getGnuboardPage(value, businessHtml)).toEqual(expected)
  })

  it('should return the board of a Gnuboard 4 post page under a sub-path', () => {
    const value = 'http://ksum.org/g4/bbs/board.php?bo_table=column_man&wr_id=465'
    const expected: GnuboardPage = { kind: 'board', root: '/g4', board: 'column_man' }

    expect(getGnuboardPage(value, gnuboard4Html)).toEqual(expected)
  })

  it('should match the script path in any case', () => {
    const value = 'http://ksum.org/G4/BBS/Board.php?bo_table=column_man'
    const expected: GnuboardPage = { kind: 'board', root: '/G4', board: 'column_man' }

    expect(getGnuboardPage(value, gnuboard4Html)).toEqual(expected)
  })

  it('should return the board a search page echoes', () => {
    const value = 'http://helpdog.org/bbs/search.php?bo_table=zzqqnotreal'
    const content =
      '<script>var g5_url = "http://helpdog.org"; var g5_bo_table = "zzqqnotreal";</script>'
    const expected: GnuboardPage = { kind: 'board', root: '', board: 'zzqqnotreal' }

    expect(getGnuboardPage(value, content)).toEqual(expected)
  })

  it('should return the board of a short URL from the script variables', () => {
    const expected: GnuboardPage = { kind: 'board', root: '', board: 'blog' }

    expect(getGnuboardPage('https://www.wsgvet.com/blog/535', boardHtml)).toEqual(expected)
  })

  it('should return the root of a short URL install under a sub-path', () => {
    const value = 'https://gospelschool.kr/g5/reviews01/111'
    const expected: GnuboardPage = { kind: 'board', root: '/g5', board: 'reviews01' }

    expect(getGnuboardPage(value, subPathHtml)).toEqual(expected)
  })

  it('should return undefined for a made-up board on Gnuboard 4', () => {
    const value = 'http://hartfordkorea.com/gnuboard4/bbs/board.php?bo_table=zzqqnotreal'

    expect(getGnuboardPage(value, missingBoardHtml)).toBeUndefined()
  })

  it('should return undefined for a made-up board on Gnuboard 5', () => {
    const value = 'https://dete035.kr/bbs/board.php?bo_table=zzqqnotreal'
    const content = '<script>var g5_url = "https://dete035.kr"; var g5_bo_table  = "";</script>'

    expect(getGnuboardPage(value, content)).toBeUndefined()
  })

  it('should return undefined when the URL and the page name different boards', () => {
    const value = 'https://www.wsgvet.com/bbs/board.php?bo_table=notice'

    expect(getGnuboardPage(value, boardHtml)).toBeUndefined()
  })

  it('should return undefined for a page outside any board', () => {
    expect(getGnuboardPage('http://gjcenter.kr/', homeHtml)).toBeUndefined()
  })

  it('should return undefined for a Gnuboard 4 page off the board script', () => {
    expect(getGnuboardPage('http://ksum.org/g4/', gnuboard4Html)).toBeUndefined()
  })

  it('should return undefined for an install URL that does not parse', () => {
    const value = '<script>var g5_url = "http://"; var g5_bo_table = "blog";</script>'

    expect(getGnuboardPage('https://www.wsgvet.com/blog/535', value)).toBeUndefined()
  })

  it('should return undefined without content', () => {
    expect(getGnuboardPage('https://www.wsgvet.com/blog/535', undefined)).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(getGnuboardPage('not-a-url', boardHtml)).toBeUndefined()
  })
})

describe('gnuboardHandler', () => {
  describe('match', () => {
    it('should match a Gnuboard board page', () => {
      const value = 'https://dete035.kr/bbs/board.php?bo_table=business'

      expect(gnuboardHandler.match(value, businessHtml, gnuboardHeaders)).toBe(true)
    })

    it('should not match without the visit cookie', () => {
      const value = 'https://dete035.kr/bbs/board.php?bo_table=business'

      expect(gnuboardHandler.match(value, businessHtml, otherHeaders)).toBe(false)
    })

    it('should not match a Gnuboard page that names no board', () => {
      expect(gnuboardHandler.match('http://gjcenter.kr/', homeHtml, gnuboardHeaders)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a page that names no board', () => {
      expect(gnuboardHandler.resolve('http://gjcenter.kr/', homeHtml)).toEqual([])
    })

    it('should return the board feed under the root for a post page', () => {
      const value = 'http://ksum.org/g4/bbs/board.php?bo_table=column_man&wr_id=465'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://ksum.org/g4/bbs/rss.php?bo_table=column_man',
          hint: { key: 'gnuboard:board', label: 'Board' },
        },
      ]

      expect(gnuboardHandler.resolve(value, gnuboard4Html)).toEqual(expected)
    })

    it('should return the board feed for a short URL', () => {
      const value = 'https://www.wsgvet.com/blog/535'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.wsgvet.com/bbs/rss.php?bo_table=blog',
          hint: { key: 'gnuboard:board', label: 'Board' },
        },
      ]

      expect(gnuboardHandler.resolve(value, boardHtml)).toEqual(expected)
    })
  })
})
