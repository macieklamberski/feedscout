import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { steamHandler } from './steam.js'

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

    it('should not match age-gated store app pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/agecheck/app/620/')).toBe(false)
    })

    it('should not match store app news pages', () => {
      expect(steamHandler.match('https://store.steampowered.com/news/app/620')).toBe(false)
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

    it('should return empty array for an age-gated page', () => {
      const result = steamHandler.resolve(
        'https://store.steampowered.com/app/620/Portal_2/',
        '<div class="agegate_birthday_selector"></div>',
      )

      expect(result).toEqual([])
    })

    it('should return empty array when the icon has no src', () => {
      const result = steamHandler.resolve(
        'https://store.steampowered.com/app/620/Portal_2/',
        '<div class="apphub_AppIcon"><img src=""></div>',
      )

      expect(result).toEqual([])
    })

    it('should return empty array when content is missing', () => {
      const result = steamHandler.resolve('https://store.steampowered.com/app/620/Portal_2/')

      expect(result).toEqual([])
    })
  })
})
