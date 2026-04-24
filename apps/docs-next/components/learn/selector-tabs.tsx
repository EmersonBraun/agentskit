'use client'

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock'
import {
  usePackageManager,
  useProvider,
  useMemory,
  PACKAGE_MANAGERS,
  PROVIDERS,
  MEMORIES,
} from '@/lib/stack-state'

function TabRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-ak-border bg-ak-surface p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded px-3 py-1.5 font-mono text-xs transition ${
              active
                ? 'bg-ak-foam text-ak-midnight'
                : 'text-ak-graphite hover:text-ak-foam'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function PackageManagerBlock({ packages }: { packages: string }) {
  const [pm, setPm] = usePackageManager()
  const entry = PACKAGE_MANAGERS.find((p) => p.value === pm) ?? PACKAGE_MANAGERS[0]
  const command = `${entry.add} ${packages}`
  return (
    <div data-ak-learn-selector className="my-4 space-y-2">
      <TabRow options={PACKAGE_MANAGERS} value={pm} onChange={setPm} />
      <DynamicCodeBlock lang="bash" code={command} />
    </div>
  )
}

export function ProviderBlock() {
  const [provider, setProvider] = useProvider()
  const entry = PROVIDERS.find((p) => p.value === provider) ?? PROVIDERS[0]
  const code = `import { ${entry.factory} } from '${entry.pkg}'

export const adapter = ${entry.factory}({
  apiKey: process.env.${entry.factory.toUpperCase()}_API_KEY!,
  model: '${entry.model}',
})`
  return (
    <div data-ak-learn-selector className="my-4 space-y-2">
      <TabRow options={PROVIDERS} value={provider} onChange={setProvider} />
      <DynamicCodeBlock lang="ts" code={code} />
    </div>
  )
}

export function MemoryBlock() {
  const [memory, setMemory] = useMemory()
  const entry = MEMORIES.find((m) => m.value === memory) ?? MEMORIES[0]
  const code = `import { ${entry.factory} } from '${entry.pkg}'

export const memory = ${entry.factory}${entry.args}`
  return (
    <div data-ak-learn-selector className="my-4 space-y-2">
      <TabRow options={MEMORIES} value={memory} onChange={setMemory} />
      <DynamicCodeBlock lang="ts" code={code} />
    </div>
  )
}
