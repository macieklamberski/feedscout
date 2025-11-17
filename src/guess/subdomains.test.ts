import { describe, expect, it } from 'bun:test'
import { getSubdomainVariants, getWwwCounterpart } from './subdomains.js'

describe('getWwwCounterpart', () => {
  it('should add www to non-www domain', () => {
    const value = 'https://example.com'
    const expected = ['https://www.example.com']

    expect(getWwwCounterpart(value)).toEqual(expected)
  })

  it('should remove www from www domain', () => {
    const value = 'https://www.example.com'
    const expected = ['https://example.com']

    expect(getWwwCounterpart(value)).toEqual(expected)
  })

  it('should handle http protocol', () => {
    const value = 'http://example.com'
    const expected = ['http://www.example.com']

    expect(getWwwCounterpart(value)).toEqual(expected)
  })

  it('should preserve port numbers', () => {
    const value = 'https://example.com:8080'
    const expected = ['https://www.example.com:8080']

    expect(getWwwCounterpart(value)).toEqual(expected)
  })

  it('should add www to domain with existing subdomain', () => {
    const value = 'https://blog.example.com'
    const expected = ['https://www.blog.example.com']

    expect(getWwwCounterpart(value)).toEqual(expected)
  })

  it('should remove www from domain with other subdomain', () => {
    const value = 'https://www.blog.example.com'
    const expected = ['https://blog.example.com']

    expect(getWwwCounterpart(value)).toEqual(expected)
  })

  it('should ignore paths and query params in origin', () => {
    const value = 'https://example.com/path?query=1'
    const expected = ['https://www.example.com']

    expect(getWwwCounterpart(value)).toEqual(expected)
  })
})

describe('getSubdomainVariants', () => {
  it('should generate single subdomain variant', () => {
    const value = 'https://example.com'
    const expected = ['https://blog.example.com']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should generate multiple subdomain variants', () => {
    const value = 'https://example.com'
    const expected = [
      'https://blog.example.com',
      'https://feeds.example.com',
      'https://news.example.com',
    ]

    expect(getSubdomainVariants(value, ['blog', 'feeds', 'news'])).toEqual(expected)
  })

  it('should return root domain when prefix is empty string', () => {
    const value = 'https://www.example.com'
    const expected = ['https://example.com']

    expect(getSubdomainVariants(value, [''])).toEqual(expected)
  })

  it('should handle mix of empty and non-empty prefixes', () => {
    const value = 'https://www.example.com'
    const expected = ['https://example.com', 'https://blog.example.com']

    expect(getSubdomainVariants(value, ['', 'blog'])).toEqual(expected)
  })

  it('should preserve http protocol', () => {
    const value = 'http://example.com'
    const expected = ['http://blog.example.com']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should preserve port numbers', () => {
    const value = 'https://example.com:8080'
    const expected = ['https://blog.example.com:8080']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should strip existing subdomain and apply new ones', () => {
    const value = 'https://www.example.com'
    const expected = ['https://blog.example.com', 'https://feeds.example.com']

    expect(getSubdomainVariants(value, ['blog', 'feeds'])).toEqual(expected)
  })

  it('should handle multi-level existing subdomain', () => {
    const value = 'https://api.v2.example.com'
    const expected = ['https://blog.example.com']

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should handle www in prefixes', () => {
    const value = 'https://example.com'
    const expected = ['https://www.example.com']

    expect(getSubdomainVariants(value, ['www'])).toEqual(expected)
  })

  it('should return empty array for empty prefix array', () => {
    const value = 'https://example.com'
    const expected: Array<string> = []

    expect(getSubdomainVariants(value, [])).toEqual(expected)
  })

  it('should return empty array for localhost', () => {
    const value = 'http://localhost'
    const expected: Array<string> = []

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })

  it('should return empty array for IP addresses', () => {
    const value = 'http://192.168.1.1'
    const expected: Array<string> = []

    expect(getSubdomainVariants(value, ['blog'])).toEqual(expected)
  })
})
