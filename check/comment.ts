import type { PlatformResult, ShapeResult } from './verdict.js'

export const unmeasuredBlock = '// (unmeasured, keep the existing block)'

const labelText: Record<string, string> = {
  discoverable: 'Discoverable without handler.',
  partially: 'Partially discoverable without handler.',
  'not-discoverable': 'Not discoverable without handler.',
}

export const renderComment = ({ label, botWalled, authenticated, shapes }: PlatformResult) => {
  if (!labelText[label]) {
    return unmeasuredBlock
  }

  const lines = [`// Discoverability: ${labelText[label]}`]

  // A partly covered shape is one where generic finds some of the handler's
  // feeds and not the rest.
  if (label !== 'discoverable') {
    const named = (group: Array<ShapeResult>) => group.map((shape) => shape.shape).join(', ')
    const covered = shapes.filter((shape) => shape.state === 'discoverable')
    const partial = shapes.filter((shape) => shape.state === 'partially')
    const uncovered = shapes.filter((shape) => shape.state === 'not-discoverable')

    if (covered.length > 0) {
      const methods = [
        ...new Set(covered.flatMap((s) => s.generic.map((u) => u.method).filter(Boolean))),
      ]
      lines.push(`// Generic covers: ${named(covered)} (${methods.join(', ')}).`)
    }

    if (partial.length > 0) {
      lines.push(`// Generic partly covers: ${named(partial)}.`)
    }

    if (uncovered.length > 0) {
      lines.push(
        `// Handler needed for: ${covered.length + partial.length === 0 ? 'all shapes' : named(uncovered)}.`,
      )
    }
  }

  if (botWalled) {
    lines.push(
      '// The page rejects a plain fetch, so a consumer on the default fetch',
      '// reaches no feed regardless of the label.',
    )
  }

  if (authenticated) {
    lines.push(
      '// Measured with account feed parameters, which a consumer does not have.',
      '// Unauthenticated reads are capped near one request per minute.',
    )
  }

  return lines.join('\n')
}
