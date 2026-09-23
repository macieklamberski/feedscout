import { describe, expect, it } from 'bun:test'
import type { DiscoverFetchFn, DiscoverUriEntry } from '../../../common/types.js'
import { steamHandler } from './steam.js'

const apiUrl = 'https://api.steampowered.com/ICommunityService/GetApps/v1/?appids[0]=620'

const appPageHtml = `
  <div class="apphub_HeaderStandardTop">
    <div class="apphub_AppIcon"><img src="https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg"><div class="overlay"></div></div>
    <div class="apphub_AppName">Portal 2</div>
  </div>
`

const createMockFetch = (responses: Record<string, string>): DiscoverFetchFn => {
  return async (url: string) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
    statusText: url in responses ? 'OK' : 'Not Found',
  })
}

describe('steamHandler', () => {
  describe('match', () => {
    it('should match store app pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/app/620/Portal_2/')).toBe(true)
    })

    it('should match age-gated store app pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/agecheck/app/620/')).toBe(true)
    })

    it('should match store app news pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/news/app/620')).toBe(true)
    })

    it('should match community app pages', () => {
      expect(steamHandler.match('https://steamcommunity.com/app/620')).toBe(true)
    })

    it('should not match community group pages', () => {
      expect(steamHandler.match('https://steamcommunity.com/groups/Valve')).toBe(false)
    })

    it('should not match the store homepage', () => {
      expect(steamHandler.match('https://store.steampowered.com/')).toBe(false)
    })

    it('should not match app paths on other hosts', () => {
      expect(steamHandler.match('https://example.com/app/620')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(steamHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('store app page', () => {
      it('should return the app icon from the page', async () => {
        const mockFetch = createMockFetch({})
        const result = await steamHandler.resolve(
          'https://store.steampowered.com/app/620/Portal_2/',
          appPageHtml,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg',
          },
        ]

        expect(result).toEqual(expected)
      })

      it('should return the app icon from the page without fetchFn', async () => {
        const result = await steamHandler.resolve(
          'https://store.steampowered.com/app/620/Portal_2/',
          appPageHtml,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg',
          },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('community app page', () => {
      it('should return the app icon from the page', async () => {
        const mockFetch = createMockFetch({})
        const result = await steamHandler.resolve(
          'https://steamcommunity.com/app/620',
          appPageHtml,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg',
          },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('age-gated store app page', () => {
      it('should return the app icon from the API', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({
            response: {
              apps: [
                {
                  appid: 620,
                  name: 'Portal 2',
                  icon: '25a5a16b2423bf7487ac5340b5b0948cef48c5f8',
                },
              ],
            },
          }),
        })
        const result = await steamHandler.resolve(
          'https://store.steampowered.com/agecheck/app/620/',
          '<div class="agegate_birthday_selector"></div>',
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg',
          },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('store app news page', () => {
      it('should return the app icon from the API', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({
            response: {
              apps: [
                {
                  appid: 620,
                  name: 'Portal 2',
                  icon: '25a5a16b2423bf7487ac5340b5b0948cef48c5f8',
                },
              ],
            },
          }),
        })
        const result = await steamHandler.resolve(
          'https://store.steampowered.com/news/app/620',
          undefined,
          undefined,
          mockFetch,
        )
        const expected: Array<DiscoverUriEntry> = [
          {
            uri: 'https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg',
          },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('failures', () => {
      it('should return empty array when the API has no icon for the app', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: JSON.stringify({ response: { apps: [{ appid: 620 }] } }),
        })
        const result = await steamHandler.resolve(
          'https://store.steampowered.com/news/app/620',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the API returns invalid JSON', async () => {
        const mockFetch = createMockFetch({
          [apiUrl]: 'not-json',
        })
        const result = await steamHandler.resolve(
          'https://store.steampowered.com/news/app/620',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when fetch throws', async () => {
        const mockFetch: DiscoverFetchFn = () => {
          throw new Error('Network error')
        }
        const result = await steamHandler.resolve(
          'https://store.steampowered.com/news/app/620',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })

      it('should return empty array when the page has no icon and fetchFn is missing', async () => {
        const result = await steamHandler.resolve('https://store.steampowered.com/news/app/620')

        expect(result).toEqual([])
      })

      it('should return empty array for a URL without an app id', async () => {
        const mockFetch = createMockFetch({})
        const result = await steamHandler.resolve(
          'https://steamcommunity.com/groups/Valve',
          undefined,
          undefined,
          mockFetch,
        )

        expect(result).toEqual([])
      })
    })
  })
})
