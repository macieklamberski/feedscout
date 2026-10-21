import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { HatenaAntennaPage, HatenaAntennaUrl } from './hatenaAntenna.js'
import {
  getHatenaAntennaPage,
  hatenaAntennaHandler,
  parseHatenaAntennaUrl,
} from './hatenaAntenna.js'

describe('parseHatenaAntennaUrl', () => {
  it('should return the antenna for an antenna page', () => {
    const expected: HatenaAntennaUrl = { kind: 'antenna', username: 'alice' }

    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/alice/')).toEqual(expected)
  })

  it('should keep the case and hyphen of the user', () => {
    const expected: HatenaAntennaUrl = { kind: 'antenna', username: 'Alice-Smith' }

    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/Alice-Smith/')).toEqual(expected)
  })

  it('should return the antenna for the simple view', () => {
    const expected: HatenaAntennaUrl = { kind: 'antenna', username: 'alice' }

    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/alice/simple')).toEqual(expected)
  })

  it('should return the antenna for a paged view', () => {
    const expected: HatenaAntennaUrl = { kind: 'antenna', username: 'alice' }

    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/alice/?of=20')).toEqual(expected)
  })

  it('should return the antenna for the antenna feed', () => {
    const expected: HatenaAntennaUrl = { kind: 'antenna', username: 'alice' }

    expect(parseHatenaAntennaUrl('http://a.hatena.ne.jp/alice/rss')).toEqual(expected)
  })

  it('should return the antenna for an empty group id', () => {
    const expected: HatenaAntennaUrl = { kind: 'antenna', username: 'alice' }

    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/alice/?gid=')).toEqual(expected)
  })

  it('should return the group for a group page', () => {
    const expected: HatenaAntennaUrl = { kind: 'group', username: 'alice', groupId: '390986' }

    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/alice/?gid=390986')).toEqual(expected)
  })

  it('should return the group for the ungrouped pages', () => {
    const expected: HatenaAntennaUrl = { kind: 'group', username: 'alice', groupId: 'null' }

    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/alice/?gid=null')).toEqual(expected)
  })

  it('should return the group for the simple view of a group', () => {
    const expected: HatenaAntennaUrl = { kind: 'group', username: 'alice', groupId: '390986' }
    const value = 'https://a.hatena.ne.jp/alice/simple?gid=390986'

    expect(parseHatenaAntennaUrl(value)).toEqual(expected)
  })

  it('should return the group for a group feed', () => {
    const expected: HatenaAntennaUrl = { kind: 'group', username: 'alice', groupId: '390986' }

    expect(parseHatenaAntennaUrl('http://a.hatena.ne.jp/alice/rss?gid=390986')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/')).toBeUndefined()
  })

  it('should return undefined for a path that is not a Hatena ID', () => {
    expect(parseHatenaAntennaUrl('https://a.hatena.ne.jp/robots.txt')).toBeUndefined()
  })

  it('should return undefined for another Hatena host', () => {
    expect(parseHatenaAntennaUrl('https://b.hatena.ne.jp/alice/')).toBeUndefined()
  })
})

describe('getHatenaAntennaPage', () => {
  const value = 'https://a.hatena.ne.jp/alice/?gid=441421'

  it('should return the group the group nav shows in bold', () => {
    const content = '<p id="pager_group"><a href="./">すべて</a> | <b>IT系</b></p>'
    const expected: HatenaAntennaPage = { kind: 'group', username: 'alice', groupId: '441421' }

    expect(getHatenaAntennaPage(value, content)).toEqual(expected)
  })

  it('should fall back to the antenna when the group nav shows no group in bold', () => {
    const content = '<p id="pager_group"><a href="./">すべて</a> | <a href="./?gid=1">IT系</a></p>'
    const expected: HatenaAntennaPage = { kind: 'antenna', username: 'alice' }

    expect(getHatenaAntennaPage(value, content)).toEqual(expected)
  })

  it('should keep the group without content', () => {
    const expected: HatenaAntennaPage = { kind: 'group', username: 'alice', groupId: '441421' }

    expect(getHatenaAntennaPage(value, undefined)).toEqual(expected)
  })
})

describe('hatenaAntennaHandler', () => {
  const realGroup = `
    <p id="pager_group" class="pager">
    <a href="./">すべて</a> | <b>IT系</b> | <a href="./?gid=441422">ネタ</a>
    </p>
  `
  const madeUpGroup = `
    <p id="pager_group" class="pager">
    <a href="./">すべて</a> | <a href="./?gid=441420">IT系</a> | <a href="./?gid=441422">ネタ</a>
    </p>
  `
  const antennaFeed: Array<DiscoverUriEntry> = [
    {
      uri: 'http://a.hatena.ne.jp/alice/rss',
      hint: { key: 'hatena-antenna:antenna', label: 'Antenna' },
    },
  ]

  describe('match', () => {
    it('should return true for an antenna page', () => {
      expect(hatenaAntennaHandler.match('https://a.hatena.ne.jp/alice/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(hatenaAntennaHandler.match('https://example.com/alice/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Hatena Antenna', () => {
      expect(hatenaAntennaHandler.resolve('https://example.com/alice/')).toEqual([])
    })

    it('should return the antenna feed over http for an antenna page', () => {
      expect(hatenaAntennaHandler.resolve('https://a.hatena.ne.jp/alice/')).toEqual(antennaFeed)
    })

    it('should return the group feed for a group page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://a.hatena.ne.jp/alice/rss?gid=390986',
          hint: { key: 'hatena-antenna:group', label: 'Group' },
        },
      ]

      expect(hatenaAntennaHandler.resolve('https://a.hatena.ne.jp/alice/?gid=390986')).toEqual(
        expected,
      )
    })

    it('should return the group feed for a real group page that lists no page', () => {
      const value = 'https://a.hatena.ne.jp/alice/?gid=441420'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://a.hatena.ne.jp/alice/rss?gid=441420',
          hint: { key: 'hatena-antenna:group', label: 'Group' },
        },
      ]

      expect(hatenaAntennaHandler.resolve(value, realGroup)).toEqual(expected)
    })

    it('should return the antenna feed for a made-up group', () => {
      const value = 'https://a.hatena.ne.jp/alice/?gid=99999999'

      expect(hatenaAntennaHandler.resolve(value, madeUpGroup)).toEqual(antennaFeed)
    })

    it('should return the antenna feed for a group page of a user with no groups', () => {
      const value = 'https://a.hatena.ne.jp/alice/?gid=99999999'

      expect(hatenaAntennaHandler.resolve(value, '<h1>aliceのアンテナ</h1>')).toEqual(antennaFeed)
    })

    it('should read a page with a long run of group navs in linear time', () => {
      const value = 'https://a.hatena.ne.jp/alice/?gid=99999999'
      const content = '<p id="pager_group">'.repeat(10_000)

      const start = performance.now()
      const result = hatenaAntennaHandler.resolve(value, content)
      const elapsed = performance.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(result).toEqual(antennaFeed)
    })
  })
})
