import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { producthuntHandler } from './producthunt.js'

const productJson =
  '{"__typename":"Product","id":"106091","slug":"notion","name":"Notion","canEdit":false,"websiteUrl":"https://www.notion.so","tagline":"The all-in-one workspace","logoUuid":"ff3e2acf-884a-4f4c-a383-6edfe3de0d88.png","isNoLongerOnline":false}'
const relatedProductJson =
  '{"__typename":"Product","id":"187207","slug":"craft-do","name":"Craft.do","tagline":"Docs and notes","logoUuid":"f311c239-8bb3-466f-b115-e7cc9228f438.png","isNoLongerOnline":false}'

describe('producthuntHandler', () => {
  describe('match', () => {
    it('should match product URLs', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/products/notion')).toBe(true)
    })

    it('should match product URLs without www', () => {
      expect(producthuntHandler.match('https://producthunt.com/products/notion')).toBe(true)
    })

    it('should match product subpages', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/products/notion/reviews')).toBe(
        true,
      )
    })

    it('should not match topic pages', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/topics/productivity')).toBe(
        false,
      )
    })

    it('should not match category pages', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/categories/tech')).toBe(false)
    })

    it('should not match user pages', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/@rrhoover')).toBe(false)
    })

    it('should not match the home page', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/')).toBe(false)
    })

    it('should not match non-Product Hunt URLs', () => {
      expect(producthuntHandler.match('https://example.com/products/notion')).toBe(false)
    })

    it('should return false for invalid URL', () => {
      expect(producthuntHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the product logo from the page JSON', () => {
      const value = `<script>{"data":${productJson}}</script>`
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://ph-files.imgix.net/ff3e2acf-884a-4f4c-a383-6edfe3de0d88.png' },
      ]

      expect(
        producthuntHandler.resolve('https://www.producthunt.com/products/notion', value),
      ).toEqual(expected)
    })

    it('should return the product logo from a product subpage', () => {
      const value = `<script>{"data":${productJson}}</script>`
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://ph-files.imgix.net/ff3e2acf-884a-4f4c-a383-6edfe3de0d88.png' },
      ]

      expect(
        producthuntHandler.resolve('https://www.producthunt.com/products/notion/reviews', value),
      ).toEqual(expected)
    })

    it('should skip the logos of related products listed first', () => {
      const value = `<script>{"related":[${relatedProductJson}],"data":${productJson}}</script>`
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://ph-files.imgix.net/ff3e2acf-884a-4f4c-a383-6edfe3de0d88.png' },
      ]

      expect(
        producthuntHandler.resolve('https://www.producthunt.com/products/notion', value),
      ).toEqual(expected)
    })

    it('should return empty array when only related products carry a logo', () => {
      const value = `<script>{"related":[${relatedProductJson}]}</script>`

      expect(
        producthuntHandler.resolve('https://www.producthunt.com/products/notion', value),
      ).toEqual([])
    })

    it('should return empty array when the product has no logoUuid', () => {
      const value =
        '<script>{"data":{"__typename":"Product","slug":"notion","name":"Notion"}}</script>'

      expect(
        producthuntHandler.resolve('https://www.producthunt.com/products/notion', value),
      ).toEqual([])
    })

    it('should return empty array without content', () => {
      expect(producthuntHandler.resolve('https://www.producthunt.com/products/notion')).toEqual([])
    })
  })
})
