import type { RegistryIndexEntry } from './registry'

export interface SelectOption {
  label: string
  value: string
  hint?: string
  disabled?: boolean
}

function header (label: string): SelectOption {
  // clack only dims/strikethroughs disabled rows — no real header style — so a
  // leading mark is what makes groups scannable in the list.
  return { label: `── ${label}`, value: `__group:${label}`, disabled: true }
}

function row (
  item: RegistryIndexEntry,
  value: (item: RegistryIndexEntry) => string,
): SelectOption {
  return {
    label: item.title || item.name,
    value: value(item),
    hint: item.category,
  }
}

function byTitle (a: RegistryIndexEntry, b: RegistryIndexEntry) {
  return (a.title || a.name).localeCompare(b.title || b.name)
}

/**
 * Partition registry items into labeled groups for clack `select`.
 *
 * Order: Components → Plugins → Composables → Transformers. Plugins and
 * transformers are `type: composables` on the wire but different maturity
 * categories — keep them out of the generic composables bucket.
 */
export function groupedRegistryOptions (
  items: RegistryIndexEntry[],
  value: (item: RegistryIndexEntry) => string = item => item.name,
): SelectOption[] {
  const components = items.filter(item => item.type === 'components').toSorted(byTitle)
  const plugins = items
    .filter(item => item.type === 'composables' && item.category === 'plugins')
    .toSorted(byTitle)
  const transformers = items
    .filter(item => item.type === 'composables' && item.category === 'transformers')
    .toSorted(byTitle)
  const composables = items
    .filter(item =>
      item.type === 'composables'
      && item.category !== 'plugins'
      && item.category !== 'transformers',
    )
    .toSorted(byTitle)

  const options: SelectOption[] = []

  function push (label: string, group: RegistryIndexEntry[]) {
    if (group.length === 0) return
    options.push(header(label))
    for (const item of group) {
      options.push(row(item, value))
    }
  }

  push('Components', components)
  push('Plugins', plugins)
  push('Composables', composables)
  push('Transformers', transformers)

  return options
}
