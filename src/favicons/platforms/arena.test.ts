import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { arenaEnricher, arenaHandler } from './arena.js'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const profileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://static.avatars.are.na/15/large_f91bdac52d14ef988c9818884d6865db.jpg?1616377630"
        data-next-head=""
      />
      <meta
        property="og:image:width"
        content="1200"
        data-next-head=""
      />
    </head>
  </html>
`

const placeholderProfileHtml = `
  <html>
    <head>
      <meta
        property="og:image"
        content="https://www.are.na/og-image.png"
        data-next-head=""
      />
    </head>
  </html>
`

const channelRef: DiscoverRef = {
  platform: 'arena',
  id: 'meg-miller/good-sign-offs',
  url: 'https://www.are.na/meg-miller/good-sign-offs',
}

const channelApiUrl = 'https://api.are.na/v2/channels/good-sign-offs?per=1'

const channelJson = JSON.stringify({
  id: 207511,
  slug: 'good-sign-offs',
  user: {
    slug: 'meg-miller',
    avatar_image: {
      thumb:
        'https://static.avatars.are.na/4094/small_f3db7f44de1bb70e00b733c71b6ac80e.jpg?1496713662',
      display:
        'https://static.avatars.are.na/4094/medium_f3db7f44de1bb70e00b733c71b6ac80e.jpg?1496713662',
    },
  },
})

describe('arenaHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(arenaHandler.match('https://www.are.na/charles-broskoski')).toBe(true)
    })

    it('should not match editorial pages', () => {
      expect(arenaHandler.match('https://www.are.na/editorial')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('profile pages', () => {
      it('should return the og:image avatar', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          profileHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://static.avatars.are.na/15/large_f91bdac52d14ef988c9818884d6865db.jpg?1616377630',
          },
        ]

        expect(result).toEqual(expected)
      })

      it('should return empty array for the placeholder og:image', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          placeholderProfileHtml,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when og:image is missing', async () => {
        const result = await arenaHandler.resolve(
          'https://www.are.na/charles-broskoski',
          '<html><head></head></html>',
        )

        expect(result).toEqual([])
      })

      it('should return empty array without content', async () => {
        const result = await arenaHandler.resolve('https://www.are.na/charles-broskoski')

        expect(result).toEqual([])
      })
    })

    it('should return a ref for channel pages', async () => {
      const result = await arenaHandler.resolve(
        'https://www.are.na/meg-miller/good-sign-offs',
        profileHtml,
      )
      const expected: Array<DiscoverRef> = [channelRef]

      expect(result).toEqual(expected)
    })

    it('should return a ref for channel subpages', async () => {
      const value = 'https://www.are.na/meg-miller/good-sign-offs/table'
      const expected: Array<DiscoverRef> = [
        { platform: 'arena', id: 'meg-miller/good-sign-offs', url: value },
      ]

      expect(await arenaHandler.resolve(value, profileHtml)).toEqual(expected)
    })

    it('should return empty array for editorial pages', async () => {
      const result = await arenaHandler.resolve('https://www.are.na/editorial', profileHtml)

      expect(result).toEqual([])
    })
  })
})

describe('arenaEnricher', () => {
  it('should return the channel owner avatar in the large size', async () => {
    const context = createContext({ [channelApiUrl]: channelJson })
    const expected = [
      'https://static.avatars.are.na/4094/large_f3db7f44de1bb70e00b733c71b6ac80e.jpg?1496713662',
    ]

    expect(await arenaEnricher(channelRef, context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'user',
      url: 'https://example.com/@user',
    }

    expect(await arenaEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array for a ref without a channel', async () => {
    const ref: DiscoverRef = {
      platform: 'arena',
      id: 'meg-miller',
      url: 'https://www.are.na/meg-miller',
    }

    expect(await arenaEnricher(ref, createContext({}))).toEqual([])
  })

  it('should return empty array when the channel belongs to another user', async () => {
    const context = createContext({ [channelApiUrl]: channelJson })
    const ref: DiscoverRef = {
      platform: 'arena',
      id: 'charles-broskoski/good-sign-offs',
      url: 'https://www.are.na/charles-broskoski/good-sign-offs',
    }

    expect(await arenaEnricher(ref, context)).toEqual([])
  })

  it('should return empty array when the owner has no avatar', async () => {
    const json = JSON.stringify({
      user: {
        slug: 'meg-miller',
        avatar_image: {
          thumb: '',
          display: '',
        },
      },
    })
    const context = createContext({ [channelApiUrl]: json })

    expect(await arenaEnricher(channelRef, context)).toEqual([])
  })

  it('should return empty array when the avatar is not on the avatars host', async () => {
    const json = JSON.stringify({
      user: {
        slug: 'meg-miller',
        avatar_image: {
          display: 'https://example.com/medium_avatar.jpg',
        },
      },
    })
    const context = createContext({ [channelApiUrl]: json })

    expect(await arenaEnricher(channelRef, context)).toEqual([])
  })

  it('should return empty array when avatar_image is missing', async () => {
    const json = JSON.stringify({ user: { slug: 'meg-miller' } })
    const context = createContext({ [channelApiUrl]: json })

    expect(await arenaEnricher(channelRef, context)).toEqual([])
  })

  it('should reject when the API returns invalid JSON', async () => {
    const context = createContext({ [channelApiUrl]: 'not-json' })

    await expect(arenaEnricher(channelRef, context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(arenaEnricher(channelRef, { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    await expect(arenaEnricher(channelRef, createContext({}))).rejects.toThrow()
  })
})
