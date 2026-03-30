import { describe, expect, it } from 'bun:test'
import { defaultExtractor } from './extractors.js'

describe('defaultExtractor', () => {
  it('should return isValid: true for status 200', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 200 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: true })
  })

  it('should return isValid: true for status 299', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 299 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: true })
  })

  it('should return isValid: true for status 301', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 301 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: true })
  })

  it('should return isValid: true for status 399', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 399 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: true })
  })

  it('should return isValid: false for status 400', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 400 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: false })
  })

  it('should return isValid: false for status 404', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 404 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: false })
  })

  it('should return isValid: false for status 500', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 500 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: false })
  })

  it('should return isValid: false for status 199', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: 199 })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: false })
  })

  it('should return isValid: false for undefined status', async () => {
    const result = await defaultExtractor({ url: 'https://example.com/icon.png', content: '', status: undefined })

    expect(result).toEqual({ url: 'https://example.com/icon.png', isValid: false })
  })
})
