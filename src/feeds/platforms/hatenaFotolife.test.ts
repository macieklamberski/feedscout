import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { HatenaFotolifeUrl } from './hatenaFotolife.js'
import { hatenaFotolifeHandler, parseHatenaFotolifeUrl } from './hatenaFotolife.js'

describe('parseHatenaFotolifeUrl', () => {
  it('should return the user for a photo page with a trailing slash', () => {
    const expected: HatenaFotolifeUrl = { kind: 'user', username: 'user' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/user/20240101123456/')).toEqual(expected)
  })

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
    const value = 'https://f.hatena.ne.jp/alice/?model=FinePixViewer%20Lite%20Ver.4.2'
    const expected: HatenaFotolifeUrl = {
      kind: 'model',
      username: 'alice',
      model: 'FinePixViewer Lite Ver.4.2',
    }

    expect(parseHatenaFotolifeUrl(value)).toEqual(expected)
  })

  it('should return the model for a model feed', () => {
    const value = 'https://f.hatena.ne.jp/alice/rss?model=iPhone+12+Pro+Max'
    const expected: HatenaFotolifeUrl = {
      kind: 'model',
      username: 'alice',
      model: 'iPhone 12 Pro Max',
    }

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
    const value = 'https://f.hatena.ne.jp/alice/t/%E3%82%A4%E3%83%A9%E3%82%B9%E3%83%88'
    const expected: HatenaFotolifeUrl = { kind: 'tag', username: 'alice', tag: 'イラスト' }

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

  it('should return undefined for a path that is not a Hatena ID', () => {
    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/favicon.ico')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseHatenaFotolifeUrl('https://example.com/alice/')).toBeUndefined()
  })
})

describe('hatenaFotolifeHandler', () => {
  const withoutPhoto = '<div class="fotolist"></div>'

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

    it('should return the https photos feed for an http user page', () => {
      const value = 'http://f.hatena.ne.jp/alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/rss',
          hint: { key: 'hatena-fotolife:photos', label: 'Photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
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
          uri: 'https://f.hatena.ne.jp/alice/rss?model=FinePixViewer%20Lite%20Ver.4.2',
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

    it('should return the folder feed for a folder page that lists no photo', () => {
      const value = 'https://f.hatena.ne.jp/alice/anime/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/anime/rss',
          hint: { key: 'hatena-fotolife:folder', label: 'Folder' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value, withoutPhoto)).toEqual(expected)
    })

    it('should return the tag feed for a tag page that lists no photo', () => {
      const value = 'https://f.hatena.ne.jp/alice/t/sky'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/t/sky?mode=rss',
          hint: { key: 'hatena-fotolife:tag', label: 'Tag' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value, withoutPhoto)).toEqual(expected)
    })

    it('should return the camera model feed for a model page that lists no photo', () => {
      const value = 'https://f.hatena.ne.jp/alice/?model=E-PL5'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/rss?model=E-PL5',
          hint: { key: 'hatena-fotolife:model', label: 'Camera model' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value, withoutPhoto)).toEqual(expected)
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

  describe('getFeedKey', () => {
    it('should return the photos key for a photos feed', () => {
      const value = 'https://f.hatena.ne.jp/aiken_makiss/rss'
      const expected = 'hatena-fotolife:photos'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the photos key for a user with an escaped hyphen', () => {
      const value = 'https://f.hatena.ne.jp/bon%2Dku%2Dra/rss'
      const expected = 'hatena-fotolife:photos'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the model key for a camera model feed', () => {
      const value = 'https://f.hatena.ne.jp/kakashibennett/rss?model=SC%2D04F'
      const expected = 'hatena-fotolife:model'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the folder key for a folder feed', () => {
      const value =
        'https://f.hatena.ne.jp/yotsuba%2Drope%2Dsystem/%E3%83%AD%E3%83%BC%E3%83%97%E3%82%AC%E3%83%BC%E3%83%89/rss'
      const expected = 'hatena-fotolife:folder'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the tag key for a tag feed', () => {
      const value =
        'https://f.hatena.ne.jp/one%2Dseater/t/%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB?mode=rss'
      const expected = 'hatena-fotolife:tag'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the stars key for a stars feed', () => {
      const value = 'https://f.hatena.ne.jp/aiken_makiss/favorite?mode=rss'
      const expected = 'hatena-fotolife:stars'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return the Star Friends key for a Star Friends feed', () => {
      const value = 'https://f.hatena.ne.jp/aiken_makiss/starfriends?mode=rss'
      const expected = 'hatena-fotolife:star-friends'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBe(expected)
    })

    it('should return undefined for a user page', () => {
      const value = 'https://f.hatena.ne.jp/aiken_makiss/'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a camera model page', () => {
      const value = 'https://f.hatena.ne.jp/aiken_makiss/?model=DMC%2DGX7MK2'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a tag page', () => {
      const value = 'https://f.hatena.ne.jp/one%2Dseater/t/%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for a stars page', () => {
      const value = 'https://f.hatena.ne.jp/aiken_makiss/favorite'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/aiken_makiss/rss'

      expect(hatenaFotolifeHandler.getFeedKey?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://f.hatena.ne.jp/bon%2Dku%2Dra/rss',
        { key: 'hatena-fotolife:photos', label: 'Photos' },
      ],
      [
        'https://f.hatena.ne.jp/kakashibennett/rss?model=SC%2D04F',
        { key: 'hatena-fotolife:model', label: 'Camera model' },
      ],
      [
        'https://f.hatena.ne.jp/one%2Dseater/%E3%83%96%E3%83%AD%E6%B4%BB/rss',
        { key: 'hatena-fotolife:folder', label: 'Folder' },
      ],
      [
        'https://f.hatena.ne.jp/one%2Dseater/t/%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB?mode=rss',
        { key: 'hatena-fotolife:tag', label: 'Tag' },
      ],
      [
        'https://f.hatena.ne.jp/aiken_makiss/favorite?mode=rss',
        { key: 'hatena-fotolife:stars', label: 'Stars' },
      ],
      [
        'https://f.hatena.ne.jp/aiken_makiss/starfriends?mode=rss',
        { key: 'hatena-fotolife:star-friends', label: 'Star Friends' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [hatenaFotolifeHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
