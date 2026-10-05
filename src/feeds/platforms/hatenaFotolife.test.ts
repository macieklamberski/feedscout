import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { HatenaFotolifeUrl } from './hatenaFotolife.js'
import { hatenaFotolifeHandler, parseHatenaFotolifeUrl } from './hatenaFotolife.js'

describe('parseHatenaFotolifeUrl', () => {
  it('should return the user for a user page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/')).toEqual(expected)
  })

  it('should return the user for an ID ending in a hyphen', () => {
    const expected: HatenaFotolifeUrl = { kind: 'user', username: 'alice-' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice-/')).toEqual(expected)
  })

  it('should return the user for a photo page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/20191231235837')).toEqual(expected)
  })

  it('should return the user for the user feed', () => {
    const expected: HatenaFotolifeUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/rss')).toEqual(expected)
  })

  it('should return the user for the user feed with a trailing slash', () => {
    const expected: HatenaFotolifeUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/rss/')).toEqual(expected)
  })

  it('should return the user for a tag segment without a tag', () => {
    const expected: HatenaFotolifeUrl = { kind: 'user', username: 'alice' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/t/')).toEqual(expected)
  })

  it('should return the model for a user page filtered by camera model', () => {
    const expected: HatenaFotolifeUrl = {
      kind: 'model',
      username: 'alice',
      model: 'FinePixViewer Lite Ver.4.2',
    }
    const value = 'https://f.hatena.ne.jp/alice/?model=FinePixViewer%20Lite%20Ver.4.2'

    expect(parseHatenaFotolifeUrl(value)).toEqual(expected)
  })

  it('should return the model for a model feed', () => {
    const expected: HatenaFotolifeUrl = {
      kind: 'model',
      username: 'alice',
      model: 'iPhone 12 Pro Max',
    }
    const value = 'https://f.hatena.ne.jp/alice/rss?model=iPhone+12+Pro+Max'

    expect(parseHatenaFotolifeUrl(value)).toEqual(expected)
  })

  it('should return the folder for a folder page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'folder', username: 'alice', folder: 'anime' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/anime/')).toEqual(expected)
  })

  it('should return the folder for a folder feed', () => {
    const expected: HatenaFotolifeUrl = { kind: 'folder', username: 'alice', folder: 'anime' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/anime/rss')).toEqual(expected)
  })

  it('should return the decoded tag for a tag page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'tag', username: 'alice', tag: 'イラスト' }
    const value = 'https://f.hatena.ne.jp/alice/t/%E3%82%A4%E3%83%A9%E3%82%B9%E3%83%88'

    expect(parseHatenaFotolifeUrl(value)).toEqual(expected)
  })

  it('should return the stars for a favorite page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'favorite', username: 'alice' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/favorite')).toEqual(expected)
  })

  it('should return the Star Friends for a starfriends page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'starfriends', username: 'alice' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/alice/starfriends')).toEqual(expected)
  })

  it('should return undefined for the home page', () => {
    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/')).toBeUndefined()
  })

  it('should return undefined for a site-wide camera model listing', () => {
    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/model/305SH')).toBeUndefined()
  })

  const siteWidePaths: Array<string> = ['focallength', 'fotocolor', 'help', 'hotfoto', 'userlist']

  it.each(siteWidePaths)('should return undefined for the site-wide %s listing', (path) => {
    expect(parseHatenaFotolifeUrl(`https://f.hatena.ne.jp/${path}/`)).toBeUndefined()
  })

  it('should return undefined for a path that is not a Hatena ID', () => {
    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/favicon.ico')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHatenaFotolifeUrl('https://example.com/alice/')).toBeUndefined()
  })
})

describe('hatenaFotolifeHandler', () => {
  const withPhoto =
    '<ul class="fotolist"><li><a href="/alice/1"><img class="foto_thumb" src="x.jpg" /></a></li></ul>'
  const withoutPhoto = '<div class="fotolist"></div>'
  const photosFeed: Array<DiscoverUriEntry> = [
    {
      uri: 'https://f.hatena.ne.jp/alice/rss',
      hint: { key: 'hatena-fotolife:photos', label: 'Photos' },
    },
  ]

  describe('match', () => {
    it('should return true for a user page', () => {
      expect(hatenaFotolifeHandler.match('https://f.hatena.ne.jp/alice/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(hatenaFotolifeHandler.match('https://example.com/alice/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Hatena Fotolife', () => {
      expect(hatenaFotolifeHandler.resolve('https://example.com/alice/')).toEqual([])
    })

    it('should return the photos feed for a user page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/rss',
          hint: { key: 'hatena-fotolife:photos', label: 'Photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice/')).toEqual(expected)
    })

    it('should escape a hyphen in the user of the photos feed', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice%2D/rss',
          hint: { key: 'hatena-fotolife:photos', label: 'Photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice-/')).toEqual(expected)
    })

    it('should return the camera model feed for a model page', () => {
      const value = 'https://f.hatena.ne.jp/alice/?model=FinePixViewer%20Lite%20Ver.4.2'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/rss?model=FinePixViewer%20Lite%20Ver%2E4%2E2',
          hint: { key: 'hatena-fotolife:model', label: 'Camera model' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the folder feed for a folder page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/anime/rss',
          hint: { key: 'hatena-fotolife:folder', label: 'Folder' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice/anime/')).toEqual(expected)
    })

    it('should escape punctuation in the folder of the folder feed', () => {
      const value = 'https://f.hatena.ne.jp/alice/Arabia,iittala/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/Arabia%2Ciittala/rss',
          hint: { key: 'hatena-fotolife:folder', label: 'Folder' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the folder feed for a folder page that lists photos', () => {
      const value = 'https://f.hatena.ne.jp/alice/anime/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/anime/rss',
          hint: { key: 'hatena-fotolife:folder', label: 'Folder' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value, withPhoto)).toEqual(expected)
    })

    it('should return the photos feed for a folder page that lists no photo', () => {
      const value = 'https://f.hatena.ne.jp/alice/anime/'

      expect(hatenaFotolifeHandler.resolve(value, withoutPhoto)).toEqual(photosFeed)
    })

    it('should return the tag feed for a tag page that lists photos', () => {
      const value = 'https://f.hatena.ne.jp/alice/t/sky'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/t/sky?mode=rss',
          hint: { key: 'hatena-fotolife:tag', label: 'Tag' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value, withPhoto)).toEqual(expected)
    })

    it('should return the photos feed for a tag page that lists no photo', () => {
      const value = 'https://f.hatena.ne.jp/alice/t/sky'

      expect(hatenaFotolifeHandler.resolve(value, withoutPhoto)).toEqual(photosFeed)
    })

    it('should return the camera model feed for a model page that lists photos', () => {
      const value = 'https://f.hatena.ne.jp/alice/?model=E-PL5'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/rss?model=E%2DPL5',
          hint: { key: 'hatena-fotolife:model', label: 'Camera model' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value, withPhoto)).toEqual(expected)
    })

    it('should return the photos feed for a model page that lists no photo', () => {
      const value = 'https://f.hatena.ne.jp/alice/?model=E-PL5'

      expect(hatenaFotolifeHandler.resolve(value, withoutPhoto)).toEqual(photosFeed)
    })

    it('should return the tag feed for a tag page', () => {
      const value = 'https://f.hatena.ne.jp/alice/t/%E3%82%A4%E3%83%A9%E3%82%B9%E3%83%88'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/t/%E3%82%A4%E3%83%A9%E3%82%B9%E3%83%88?mode=rss',
          hint: { key: 'hatena-fotolife:tag', label: 'Tag' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the stars feed for a favorite page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/favorite?mode=rss',
          hint: { key: 'hatena-fotolife:stars', label: 'Stars' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice/favorite')).toEqual(
        expected,
      )
    })

    it('should keep a hyphen in the user of the stars feed', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice-/favorite?mode=rss',
          hint: { key: 'hatena-fotolife:stars', label: 'Stars' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice-/favorite')).toEqual(
        expected,
      )
    })

    it('should keep a hyphen in the user of the Star Friends feed', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice-/starfriends?mode=rss',
          hint: { key: 'hatena-fotolife:star-friends', label: 'Star Friends' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice-/starfriends')).toEqual(
        expected,
      )
    })

    it('should return the Star Friends feed for a starfriends page', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/starfriends?mode=rss',
          hint: { key: 'hatena-fotolife:star-friends', label: 'Star Friends' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice/starfriends')).toEqual(
        expected,
      )
    })
  })
})
