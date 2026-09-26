import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { producthuntHandler } from './producthunt.js'

const productJson =
  '{"__typename":"Product","id":"106091","slug":"notion","name":"Notion","canEdit":false,"websiteUrl":"https://www.notion.so","tagline":"The all-in-one workspace","logoUuid":"ff3e2acf-884a-4f4c-a383-6edfe3de0d88.png","isNoLongerOnline":false}'
const relatedProductJson =
  '{"__typename":"Product","id":"187207","slug":"craft-do","name":"Craft.do","tagline":"Docs and notes","logoUuid":"f311c239-8bb3-466f-b115-e7cc9228f438.png","isNoLongerOnline":false}'

const topicPage = `
  <meta
    property="og:image"
    content="https://ph-files.imgix.net/5e906c86-5776-4ef0-9841-2b76dea8e255.jpeg?auto=format"
  />
`
const genericPage = `
  <meta
    property="og:image"
    content="https://ph-static.imgix.net/product-hunt-logo-horizontal-orange-background.png?auto=format"
  />
`
const foreignImagePage = `
  <meta
    property="og:image"
    content="https://example.com/5e906c86-5776-4ef0-9841-2b76dea8e255.jpeg"
  />
`

describe('producthuntHandler', () => {
  describe('match', () => {
    it('should match product URLs', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/products/notion')).toBe(true)
    })

    it('should match product URLs with a capitalized products segment', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/Products/notion')).toBe(true)
    })

    it('should match product URLs without www', () => {
      expect(producthuntHandler.match('https://producthunt.com/products/notion')).toBe(true)
    })

    it('should match product subpages', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/products/notion/reviews')).toBe(
        true,
      )
    })

    it('should match topic pages', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/topics/productivity')).toBe(true)
    })

    it('should match topic pages with a trailing slash', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/topics/productivity/')).toBe(
        true,
      )
    })

    it('should match topic pages with a capitalized topics segment', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/Topics/productivity')).toBe(true)
    })

    it('should not match the topics index', () => {
      expect(producthuntHandler.match('https://www.producthunt.com/topics')).toBe(false)
    })

    it('should not match topic subpages', () => {
      expect(
        producthuntHandler.match('https://www.producthunt.com/topics/productivity/launches'),
      ).toBe(false)
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

    it('should return empty array for a page outside a product', () => {
      const value = '{"slug":"notion","name":"Notion","logoUuid":"abc123.png"}'

      expect(
        producthuntHandler.resolve('https://www.producthunt.com/categories/notion', value),
      ).toEqual([])
    })

    it('should return the topic image cropped to a square', () => {
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://ph-files.imgix.net/5e906c86-5776-4ef0-9841-2b76dea8e255.jpeg?fit=crop&w=256&h=256',
        },
      ]

      expect(
        producthuntHandler.resolve('https://www.producthunt.com/topics/productivity', topicPage),
      ).toEqual(expected)
    })

    it('should return empty array for the generic share image on a topic page', () => {
      expect(
        producthuntHandler.resolve('https://www.producthunt.com/topics/productivity', genericPage),
      ).toEqual([])
    })

    it('should return empty array for a topic og:image outside ph-files.imgix.net', () => {
      expect(
        producthuntHandler.resolve(
          'https://www.producthunt.com/topics/productivity',
          foreignImagePage,
        ),
      ).toEqual([])
    })

    it('should return empty array for a topic page without content', () => {
      expect(producthuntHandler.resolve('https://www.producthunt.com/topics/productivity')).toEqual(
        [],
      )
    })
  })
})
