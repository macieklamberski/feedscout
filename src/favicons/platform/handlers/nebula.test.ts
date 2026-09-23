import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { nebulaHandler } from './nebula.js'

const createPage = (queryData: string): string => {
  return `<html><head><script type='text/javascript'>window.__QUERY_DATA__=${queryData};</script></head></html>`
}

const channel = {
  app_path: 'realengineering',
  assets: {
    avatar: {
      '256': {
        original: 'https://images.nebula.tv/e816edc6.jpeg?width=256',
        webp: 'https://images.nebula.tv/e816edc6.webp?width=256',
      },
      '512': {
        original: 'https://images.nebula.tv/e816edc6.jpeg?width=512',
        webp: 'https://images.nebula.tv/e816edc6.webp?width=512',
      },
    },
  },
}

const channelQueryData = JSON.stringify({
  mutations: [],
  queries: [
    {
      queryKey: ['featured_pages'],
      state: { data: [{ app_path: 'featured', slug: 'featured', title: 'Featured' }] },
    },
    {
      queryKey: ['content', { slugOrId: 'realengineering' }],
      state: { data: channel },
    },
  ],
})

describe('nebulaHandler', () => {
  describe('match', () => {
    it('should match channel URLs', () => {
      expect(nebulaHandler.match('https://nebula.tv/realengineering')).toBe(true)
    })

    it('should match www.nebula.tv channel URLs', () => {
      expect(nebulaHandler.match('https://www.nebula.tv/realengineering')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(nebulaHandler.match('https://nebula.tv/')).toBe(false)
    })

    it('should not match videos pages', () => {
      expect(nebulaHandler.match('https://nebula.tv/videos')).toBe(false)
      expect(nebulaHandler.match('https://nebula.tv/videos/realengineering-why-ships-float')).toBe(
        false,
      )
    })

    it('should not match explore pages', () => {
      expect(nebulaHandler.match('https://nebula.tv/explore')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(nebulaHandler.match('https://nebula.tv/login')).toBe(false)
      expect(nebulaHandler.match('https://nebula.tv/settings')).toBe(false)
    })

    it('should not match non-Nebula URLs', () => {
      expect(nebulaHandler.match('https://example.com/realengineering')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(nebulaHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return the 512 channel avatar from the page query data', () => {
        const value = createPage(channelQueryData)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.nebula.tv/e816edc6.jpeg?width=512' },
        ]

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the home page', () => {
        const value = createPage(channelQueryData)

        expect(nebulaHandler.resolve('https://nebula.tv/', value)).toEqual([])
      })

      it('should return empty array for videos pages', () => {
        const value = createPage(channelQueryData)

        expect(nebulaHandler.resolve('https://nebula.tv/videos', value)).toEqual([])
      })

      it('should return empty array for explore pages', () => {
        const value = createPage(channelQueryData)

        expect(nebulaHandler.resolve('https://nebula.tv/explore', value)).toEqual([])
      })

      it('should return empty array without page content', () => {
        expect(nebulaHandler.resolve('https://nebula.tv/realengineering')).toEqual([])
      })

      it('should return empty array when the page has no query data', () => {
        const value = '<html><head><title>Nebula</title></head></html>'

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([])
      })

      it('should return empty array when the page query data is not valid JSON', () => {
        const value = createPage('{"queries":[')

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([])
      })

      it('should return empty array when no content query is present', () => {
        const queryData = JSON.stringify({
          queries: [{ queryKey: ['featured_pages'], state: { data: [] } }],
        })
        const value = createPage(queryData)

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([])
      })

      it('should return empty array when the 512 avatar is missing', () => {
        const queryData = JSON.stringify({
          queries: [
            {
              queryKey: ['content', { slugOrId: 'realengineering' }],
              state: {
                data: {
                  assets: {
                    avatar: {
                      '256': { original: 'https://images.nebula.tv/e816edc6.jpeg?width=256' },
                    },
                  },
                },
              },
            },
          ],
        })
        const value = createPage(queryData)

        expect(nebulaHandler.resolve('https://nebula.tv/realengineering', value)).toEqual([])
      })
    })
  })
})
