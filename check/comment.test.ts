import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { renderComment, unmeasuredBlock } from './comment.js'
import baseline from './discoverability.json' with { type: 'json' }
import type { PlatformResult } from './verdict.js'

const blockRegex = /^\/\/ Discoverability:.*?(?=\n(?!\/\/))/ms

const readBlock = (platform: string): string | undefined => {
  const path = new URL(`../src/feeds/platform/handlers/${platform}.ts`, import.meta.url)

  return readFileSync(path, 'utf8').match(blockRegex)?.[0]
}

const measured = (baseline as { results: Array<PlatformResult> }).results.filter(
  (result) => result.label !== 'inconclusive',
)

describe('handler comments', () => {
  it('should measure at least one platform', () => {
    expect(measured.length).toBeGreaterThan(0)
  })

  it('should match what the baseline renders', () => {
    const drifted = measured
      .filter((result) => readBlock(result.platform) !== renderComment(result))
      .map((result) => result.platform)

    expect(drifted).toEqual([])
  })

  it('should leave an unmeasured platform its existing block', () => {
    const unmeasured = (baseline as { results: Array<PlatformResult> }).results.find(
      (result) => result.label === 'inconclusive',
    )

    expect(unmeasured && renderComment(unmeasured)).toBe(unmeasuredBlock)
  })
})
