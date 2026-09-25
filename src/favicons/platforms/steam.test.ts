import { describe, expect, it } from 'bun:test'
import type { DiscoverRef, DiscoverUriEntry, FetchFn } from '../../common/types.js'
import type { FaviconEnricherContext } from '../types.js'
import { steamEnricher, steamHandler } from './steam.js'

const apiUrl = 'https://api.steampowered.com/ICommunityService/GetApps/v1/?appids[0]=620'

const createContext = (responses: Record<string, string>): FaviconEnricherContext => {
  const fetchFn: FetchFn = async (url) => ({
    headers: new Headers(),
    body: responses[url] ?? '',
    url,
    status: url in responses ? 200 : 404,
  })

  return { fetchFn }
}

const createRef = (id: string): DiscoverRef => {
  return { platform: 'steam', id, url: `https://store.steampowered.com/news/app/${id}` }
}

const appPageHtml = `
  <div class="apphub_HeaderStandardTop">
    <div class="apphub_AppIcon"><img src="https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg"><div class="overlay"></div></div>
    <div class="apphub_AppName">Portal 2</div>
  </div>
`

describe('steamHandler', () => {
  describe('match', () => {
    it('should match store app pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/app/620/Portal_2/')).toBe(true)
    })

    it('should match community app pages', () => {
      expect(steamHandler.match('https://steamcommunity.com/app/620')).toBe(true)
    })

    it('should match age-gated store app pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/agecheck/app/620/')).toBe(true)
    })

    it('should match store app news pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/news/app/620')).toBe(true)
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
    it('should return the app icon from a store app page', () => {
      const result = steamHandler.resolve(
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

    it('should return the app icon from a community app page', () => {
      const result = steamHandler.resolve('https://steamcommunity.com/app/620', appPageHtml)
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg',
        },
      ]

      expect(result).toEqual(expected)
    })

    it('should return a ref for an age-gated store app page', () => {
      const url = 'https://store.steampowered.com/agecheck/app/620/'
      const result = steamHandler.resolve(url, '<div class="agegate_birthday_selector"></div>')
      const expected: Array<DiscoverRef> = [{ platform: 'steam', id: '620', url }]

      expect(result).toEqual(expected)
    })

    it('should return a ref for a store app news page', () => {
      const url = 'https://store.steampowered.com/news/app/620'
      const expected: Array<DiscoverRef> = [{ platform: 'steam', id: '620', url }]

      expect(steamHandler.resolve(url)).toEqual(expected)
    })

    it('should return a ref for a store app page redirected to the age gate', () => {
      const url = 'https://store.steampowered.com/app/620/Portal_2/'
      const result = steamHandler.resolve(url, '<div class="agegate_birthday_selector"></div>')
      const expected: Array<DiscoverRef> = [{ platform: 'steam', id: '620', url }]

      expect(result).toEqual(expected)
    })

    it('should return a ref for a community app page without the icon', () => {
      const url = 'https://steamcommunity.com/app/620'
      const expected: Array<DiscoverRef> = [{ platform: 'steam', id: '620', url }]

      expect(steamHandler.resolve(url, '<html></html>')).toEqual(expected)
    })

    it('should return a ref when the icon has no src', () => {
      const url = 'https://store.steampowered.com/app/620/Portal_2/'
      const result = steamHandler.resolve(url, '<div class="apphub_AppIcon"><img src=""></div>')
      const expected: Array<DiscoverRef> = [{ platform: 'steam', id: '620', url }]

      expect(result).toEqual(expected)
    })

    it('should return empty array for a URL without an app id', () => {
      expect(steamHandler.resolve('https://steamcommunity.com/groups/Valve')).toEqual([])
    })
  })
})

describe('steamEnricher', () => {
  it('should resolve the app icon from the apps API', async () => {
    const context = createContext({
      [apiUrl]: JSON.stringify({
        response: {
          apps: [
            { appid: 620, name: 'Portal 2', icon: '25a5a16b2423bf7487ac5340b5b0948cef48c5f8' },
          ],
        },
      }),
    })
    const expected = [
      'https://shared.fastly.steamstatic.com/community_assets/images/apps/620/25a5a16b2423bf7487ac5340b5b0948cef48c5f8.jpg',
    ]

    expect(await steamEnricher(createRef('620'), context)).toEqual(expected)
  })

  it('should return undefined for a ref of another platform', async () => {
    const ref: DiscoverRef = {
      platform: 'mastodon',
      id: 'user',
      url: 'https://example.com/@user',
    }

    expect(await steamEnricher(ref, createContext({}))).toBeUndefined()
  })

  it('should return empty array when the app has no icon', async () => {
    const context = createContext({
      [apiUrl]: JSON.stringify({ response: { apps: [{ appid: 620 }] } }),
    })

    expect(await steamEnricher(createRef('620'), context)).toEqual([])
  })

  it('should return empty array when the icon is empty', async () => {
    const context = createContext({
      [apiUrl]: JSON.stringify({ response: { apps: [{ appid: 620, icon: '' }] } }),
    })

    expect(await steamEnricher(createRef('620'), context)).toEqual([])
  })

  it('should return empty array when the API returns no apps', async () => {
    const context = createContext({
      [apiUrl]: JSON.stringify({ response: { apps: [] } }),
    })

    expect(await steamEnricher(createRef('620'), context)).toEqual([])
  })

  it('should reject when the API returns invalid JSON', async () => {
    const context = createContext({ [apiUrl]: 'not json' })

    await expect(steamEnricher(createRef('620'), context)).rejects.toThrow()
  })

  it('should reject when fetch throws', async () => {
    const fetchFn: FetchFn = () => {
      throw new Error('Network error')
    }

    await expect(steamEnricher(createRef('620'), { fetchFn })).rejects.toThrow()
  })

  it('should reject when the response is not 2xx', async () => {
    await expect(steamEnricher(createRef('620'), createContext({}))).rejects.toThrow()
  })
})
