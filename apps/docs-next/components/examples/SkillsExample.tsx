'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createSkillRegistry,
  researcher,
  critic,
  planner,
  coder,
  summarizer,
  technicalWriter,
  securityAuditor,
  type SkillPackage,
} from '@agentskit/skills'

const SEED_PACKAGES: SkillPackage[] = [
  { skill: researcher, tags: ['research', 'web'], version: '1.0.0', publisher: 'agentskit' },
  { skill: critic, tags: ['writing'], version: '1.0.0', publisher: 'agentskit' },
  { skill: planner, tags: ['planning'], version: '1.0.0', publisher: 'agentskit' },
  { skill: coder, tags: ['code'], version: '1.0.0', publisher: 'agentskit' },
  { skill: summarizer, tags: ['writing'], version: '1.0.0', publisher: 'agentskit' },
  { skill: technicalWriter, tags: ['writing', 'docs'], version: '1.0.0', publisher: 'agentskit' },
  { skill: securityAuditor, tags: ['security', 'code'], version: '1.0.0', publisher: 'agentskit' },
]

export function SkillsExample() {
  const registry = useMemo(() => createSkillRegistry(SEED_PACKAGES), [])
  const [packages, setPackages] = useState<SkillPackage[]>([])
  const [filter, setFilter] = useState('')
  const [activeName, setActiveName] = useState<string>('researcher')

  useEffect(() => {
    void (async () => setPackages(await registry.list()))()
  }, [registry])

  const search = async () => {
    setPackages(await registry.list(filter ? { tag: filter } : undefined))
  }

  const active = packages.find(p => p.skill.name === activeName) ?? packages[0]
  const tags = Array.from(new Set(packages.flatMap(p => p.tags ?? []))).sort()

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/skills · createSkillRegistry</span>
        <span className="text-ak-graphite">{packages.length} skills</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => { setFilter(''); void search() }}
          className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${
            filter === '' ? 'bg-ak-blue/20 text-ak-blue' : 'border border-ak-border text-ak-graphite'
          }`}
        >
          all
        </button>
        {tags.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setFilter(t); void search() }}
            className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${
              filter === t ? 'bg-ak-blue/20 text-ak-blue' : 'border border-ak-border text-ak-graphite'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto rounded-md border border-ak-border bg-ak-midnight p-2">
          {packages.map(p => (
            <button
              key={p.skill.name}
              type="button"
              onClick={() => setActiveName(p.skill.name)}
              className={`rounded-md border px-2.5 py-2 text-left font-mono text-xs transition ${
                activeName === p.skill.name
                  ? 'border-ak-blue bg-ak-blue/10 text-ak-foam'
                  : 'border-ak-border bg-ak-surface text-ak-graphite hover:text-ak-foam'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.skill.name}</span>
                <span className="text-[10px] text-ak-graphite">v{p.version}</span>
              </div>
              <div className="mt-0.5 line-clamp-2 text-[10px] text-ak-graphite">
                {p.skill.description}
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-ak-border bg-ak-midnight p-3">
          {active && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-ak-foam">{active.skill.name}</span>
                <span className="font-mono text-[10px] text-ak-graphite">
                  {active.publisher} · v{active.version}
                </span>
              </div>
              <div className="font-mono text-[11px] text-ak-graphite">{active.skill.description}</div>
              <div className="flex flex-wrap gap-1">
                {(active.tags ?? []).map(t => (
                  <span key={t} className="rounded-full bg-ak-surface px-2 py-0.5 font-mono text-[10px] text-ak-blue">
                    {t}
                  </span>
                ))}
                {(active.skill.tools ?? []).map(t => (
                  <span key={t} className="rounded-full bg-ak-green/10 px-2 py-0.5 font-mono text-[10px] text-ak-green">
                    {t}
                  </span>
                ))}
              </div>
              <div>
                <div className="mb-1 font-mono text-[10px] text-ak-graphite">systemPrompt (excerpt)</div>
                <pre className="max-h-[160px] overflow-y-auto whitespace-pre-wrap rounded border border-ak-border bg-ak-surface p-2 font-mono text-[11px] text-ak-foam">
                  {active.skill.systemPrompt.slice(0, 600)}…
                </pre>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="font-mono text-[10px] text-ak-graphite">
        publish · list · install · semver-aware · use with @agentskit/runtime
      </div>
    </div>
  )
}
