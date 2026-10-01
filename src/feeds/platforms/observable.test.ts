import { describe, expect, it } from 'bun:test'
import type { ObservableUrl } from './observable.js'
import { observableHandler, parseObservableUrl } from './observable.js'

describe('parseObservableUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: ObservableUrl = { kind: 'user', owner: 'mbostock' }

    expect(parseObservableUrl('https://observablehq.com/@mbostock')).toEqual(expected)
  })

  it('should return the user for a notebook page', () => {
    const expected: ObservableUrl = { kind: 'user', owner: 'mbostock' }

    expect(parseObservableUrl('https://observablehq.com/@mbostock/some-notebook')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: ObservableUrl = { kind: 'user', owner: 'mbostock' }

    expect(parseObservableUrl('https://www.observablehq.com/@mbostock')).toEqual(expected)
  })

  it('should return the collection for a collection page', () => {
    const value = 'https://observablehq.com/@observablehq/collection/visualization'
    const expected: ObservableUrl = {
      kind: 'collection',
      owner: 'observablehq',
      collection: 'visualization',
    }

    expect(parseObservableUrl(value)).toEqual(expected)
  })

  it('should return the collection for a collection page with a capitalized collection segment', () => {
    const value = 'https://observablehq.com/@observablehq/Collection/visualization'
    const expected: ObservableUrl = {
      kind: 'collection',
      owner: 'observablehq',
      collection: 'visualization',
    }

    expect(parseObservableUrl(value)).toEqual(expected)
  })

  it('should return the collection for a collection page in the live form', () => {
    const value = 'https://observablehq.com/@observablehq/-/collection/working-with-data'
    const expected: ObservableUrl = {
      kind: 'collection',
      owner: 'observablehq',
      collection: 'working-with-data',
    }

    expect(parseObservableUrl(value)).toEqual(expected)
  })

  it('should return undefined for paths without @ prefix', () => {
    expect(parseObservableUrl('https://observablehq.com/about')).toBeUndefined()
  })

  it('should return recent for the recent page', () => {
    const expected: ObservableUrl = { kind: 'recent' }

    expect(parseObservableUrl('https://observablehq.com/recent')).toEqual(expected)
  })

  it('should return recent for the public page sorted by publish time', () => {
    const expected: ObservableUrl = { kind: 'recent' }
    const value = 'https://observablehq.com/public?sort=publish_time'

    expect(parseObservableUrl(value)).toEqual(expected)
  })

  it('should return trending for the trending and public pages', () => {
    const expected: ObservableUrl = { kind: 'trending' }

    expect(parseObservableUrl('https://observablehq.com/trending')).toEqual(expected)
    expect(parseObservableUrl('https://observablehq.com/public')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseObservableUrl('https://observablehq.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseObservableUrl('https://example.com/@mbostock')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseObservableUrl('not-a-url')).toBeUndefined()
  })
})

describe('observableHandler', () => {
  describe('match', () => {
    it('should match an observablehq.com URL', () => {
      expect(observableHandler.match('https://observablehq.com/@mbostock')).toBe(true)
    })

    it('should not match another host', () => {
      expect(observableHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for user', () => {
      const value = 'https://observablehq.com/@mbostock'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/@mbostock.rss',
          hint: { key: 'observable:notebooks', label: 'Notebooks' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for collection', () => {
      const value = 'https://observablehq.com/@observablehq/collection/visualization'
      const expected = [
        {
          uri: 'https://api.observablehq.com/collection/@observablehq/visualization.rss',
          hint: { key: 'observable:collection', label: 'Collection' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return recent feed for /public sorted by publish time', () => {
      const value = 'https://observablehq.com/public?sort=publish_time'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: { key: 'observable:recent', label: 'Recent' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /public', () => {
      const value = 'https://observablehq.com/public'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: { key: 'observable:trending', label: 'Trending' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /public with a capitalized public segment', () => {
      const value = 'https://observablehq.com/Public'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: { key: 'observable:trending', label: 'Trending' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /public with trailing slash', () => {
      const value = 'https://observablehq.com/public/'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: { key: 'observable:trending', label: 'Trending' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://observablehq.com/'

      expect(observableHandler.resolve(value)).toEqual([])
    })

    it('should return recent feed for /recent', () => {
      const value = 'https://observablehq.com/recent'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: { key: 'observable:recent', label: 'Recent' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return recent feed for /recent with a capitalized recent segment', () => {
      const value = 'https://observablehq.com/Recent'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: { key: 'observable:recent', label: 'Recent' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending', () => {
      const value = 'https://observablehq.com/trending'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: { key: 'observable:trending', label: 'Trending' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending with a capitalized trending segment', () => {
      const value = 'https://observablehq.com/Trending'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: { key: 'observable:trending', label: 'Trending' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return recent feed for /recent with trailing slash', () => {
      const value = 'https://observablehq.com/recent/'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/public.rss',
          hint: { key: 'observable:recent', label: 'Recent' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })

    it('should return trending feed for /trending with trailing slash', () => {
      const value = 'https://observablehq.com/trending/'
      const expected = [
        {
          uri: 'https://api.observablehq.com/documents/trending.rss',
          hint: { key: 'observable:trending', label: 'Trending' },
        },
      ]

      expect(observableHandler.resolve(value)).toEqual(expected)
    })
  })
})
