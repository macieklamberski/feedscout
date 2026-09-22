import type { PlatformResult, ShapeResult } from './verdict.js'

export const unmeasuredBlock = '// (unmeasured, keep the existing block)'

const labelText: Record<string, string> = {
  discoverable: 'Discoverable without handler.',
  partially: 'Partially discoverable without handler.',
  'not-discoverable': 'Not discoverable without handler.',
}

export const renderComment = ({ label, shapes }: PlatformResult) => {
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
    const reach: Array<string> = []

    if (covered.length > 0) {
      const methods = [
        ...new Set(covered.flatMap((s) => s.generic.map((u) => u.method).filter(Boolean))),
      ]
      reach.push(`covers ${named(covered)} (${methods.join(', ')})`)
    }

    if (partial.length > 0) {
      reach.push(`partly covers ${named(partial)}`)
    }

    if (reach.length > 0) {
      lines.push(`// Generic ${reach.join(', ')}.`)
    }

    if (uncovered.length > 0) {
      lines.push(`// Handler needed for: ${reach.length === 0 ? 'all shapes' : named(uncovered)}.`)
    }
  }

  return lines.join('\n')
}
