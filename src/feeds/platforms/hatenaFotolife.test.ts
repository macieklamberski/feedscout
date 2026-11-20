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

  it('should return the newest photos listing for the userlist page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'userlist' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/userlist')).toEqual(expected)
  })

  it('should return the camera model as the URL spells it for a site-wide camera model page', () => {
    const value = 'https://f.hatena.ne.jp/model/Example%20Camera'
    const expected: HatenaFotolifeUrl = { kind: 'siteModel', model: 'Example%20Camera' }

    expect(parseHatenaFotolifeUrl(value)).toEqual(expected)
  })

  it('should return the focal length for a focal length page', () => {
    const value = 'https://f.hatena.ne.jp/focallength/14.30'
    const expected: HatenaFotolifeUrl = { kind: 'focalLength', focalLength: '14.30' }

    expect(parseHatenaFotolifeUrl(value)).toEqual(expected)
  })

  it('should return the color for a color page', () => {
    const expected: HatenaFotolifeUrl = { kind: 'color', color: 'wg' }

    expect(parseHatenaFotolifeUrl('https://f.hatena.ne.jp/fotocolor/wg')).toEqual(expected)
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice/')).toEqual(expected)
    })

    it('should return the newest photos feed for the userlist page', () => {
      const value = 'https://f.hatena.ne.jp/userlist'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site-wide camera model feed for a camera model page', () => {
      const value = 'https://f.hatena.ne.jp/model/Example%20Camera'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/model/Example%20Camera?mode=rss',
          hint: { key: 'hatena-fotolife:site-model', label: 'Photos by camera model' },
        },
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should keep an escaped percent sign and non-ASCII escapes in a camera model', () => {
      const value = 'https://f.hatena.ne.jp/model/100%25%20%E6%A9%9F'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/model/100%25%20%E6%A9%9F?mode=rss',
          hint: { key: 'hatena-fotolife:site-model', label: 'Photos by camera model' },
        },
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the focal length feed for a focal length page', () => {
      const value = 'https://f.hatena.ne.jp/focallength/14.30'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/focallength/14.30?mode=rss',
          hint: { key: 'hatena-fotolife:focal-length', label: 'Photos by focal length' },
        },
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the color feed for a color page', () => {
      const value = 'https://f.hatena.ne.jp/fotocolor/wg'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/fotocolor/wg?mode=rss',
          hint: { key: 'hatena-fotolife:color', label: 'Photos by color' },
        },
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve(value)).toEqual(expected)
    })

    it('should return the https photos feed for an http user page', () => {
      const value = 'http://f.hatena.ne.jp/alice/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://f.hatena.ne.jp/alice/rss',
          hint: { key: 'hatena-fotolife:photos', label: 'Photos' },
        },
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
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
        {
          uri: 'https://f.hatena.ne.jp/userlist?mode=rss',
          hint: { key: 'hatena-fotolife:recent', label: 'Recent photos' },
        },
      ]

      expect(hatenaFotolifeHandler.resolve('https://f.hatena.ne.jp/alice/starfriends')).toEqual(
        expected,
      )
    })
  })

  describe('getFeedHint', () => {
    it('should return the photos hint for a photos feed', () => {
      const value = 'https://f.hatena.ne.jp/alice_photos/rss'
      const expected: DiscoverUriHint = { key: 'hatena-fotolife:photos', label: 'Photos' }

      expect(hatenaFotolifeHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a camera model feed as itself', async () => {
      const value = 'https://f.hatena.ne.jp/carolshots/rss?model=SC%2D04F'
      const hint: DiscoverUriHint = { key: 'hatena-fotolife:model', label: 'Camera model' }
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
