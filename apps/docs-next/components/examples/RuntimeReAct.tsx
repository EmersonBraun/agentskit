'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createSharedContext, type SharedContext } from '@agentskit/runtime/shared-context'

type Step = {
  id: string
  agent: 'planner' | 'researcher' | 'writer' | 'critic'
  thought: string
  action: string
  observation: string
}

const SCRIPT: Step[] = [
  {
    id: 's1',
    agent: 'planner',
    thought: 'Break the task into 3 subgoals.',
    action: 'plan({ subgoals: 3 })',
    observation: 'subgoals = [research, draft, review]',
  },
  {
    id: 's2',
    agent: 'researcher',
    thought: 'Need 5 sources on agent frameworks.',
    action: 'web_search({ q: "agent frameworks 2026" })',
    observation: '12 results, top 5 cached',
  },
  {
    id: 's3',
    agent: 'writer',
    thought: 'Draft post using cached sources.',
    action: 'compose({ tone: "neutral", len: 600 })',
    observation: 'draft.md created · 612 words',
  },
  {
    id: 's4',
    agent: 'critic',
    thought: 'Score the draft and surface weak claims.',
    action: 'critique({ draft })',
    observation: 'score 8.2/10 · 2 weak claims flagged',
  },
]

const COLOR: Record<Step['agent'], string> = {
  planner: 'bg-ak-blue',
  researcher: 'bg-ak-green',
  writer: 'bg-[#a78bfa]',
  critic: 'bg-[#f0b429]',
}

export function RuntimeReAct() {
  const ctx: SharedContext = useMemo(() => createSharedContext({ task: 'research-and-draft' }), [])
  const [running, setRunning] = useState(false)
  const [stepIdx, setStepIdx] = useState(-1)

  useEffect(() => {
    if (!running) return
    if (stepIdx >= SCRIPT.length - 1) {
      setRunning(false)
      return
    }
    const t = setTimeout(() => {
      const next = stepIdx + 1
      ctx.set(`step.${SCRIPT[next].id}`, SCRIPT[next].observation)
      setStepIdx(next)
    }, 900)
    return () => clearTimeout(t)
  }, [running, stepIdx, ctx])

  const start = () => {
    setStepIdx(-1)
    setRunning(true)
    setTimeout(() => setStepIdx(0), 100)
  }

  const reset = () => {
    setRunning(false)
    setStepIdx(-1)
  }

  const visible = SCRIPT.slice(0, stepIdx + 1)
  const ctxEntries = Object.entries(ctx.entries()).filter(([k]) => k !== 'task')

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/runtime · createSharedContext · ReAct loop</span>
        <span className="text-ak-graphite">task: research-and-draft</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="rounded-md bg-ak-green/20 px-3 py-1.5 font-mono text-xs text-ak-green disabled:opacity-50"
        >
          {running ? 'orchestrating…' : '▶ play flow'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-ak-border px-3 py-1.5 font-mono text-xs text-ak-graphite"
        >
          reset
        </button>
        <span className="ml-auto font-mono text-[10px] text-ak-graphite">
          step {Math.max(0, stepIdx + 1)} / {SCRIPT.length}
        </span>
      </div>

      <div className="rounded-md border border-ak-border bg-ak-midnight p-4">
        <div className="mb-3 flex items-center justify-between">
          {SCRIPT.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <motion.div
                animate={{
                  scale: i === stepIdx ? 1.15 : 1,
                  opacity: i <= stepIdx ? 1 : 0.35,
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className={`flex h-9 w-9 items-center justify-center rounded-full font-mono text-[10px] text-ak-midnight ${COLOR[s.agent]}`}
              >
                {i + 1}
              </motion.div>
              {i < SCRIPT.length - 1 && (
                <div className="relative mx-1 h-0.5 flex-1 bg-ak-border">
                  <motion.div
                    initial={false}
                    animate={{ width: i < stepIdx ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                    className="absolute left-0 top-0 h-0.5 bg-ak-blue"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between font-mono text-[10px] text-ak-foam">
          {SCRIPT.map(s => (
            <span key={s.id} className="flex-1 text-center">{s.agent}</span>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-ak-border bg-ak-midnight p-3">
        <div className="mb-2 font-mono text-[10px] text-ak-graphite">step trace</div>
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {visible.map(s => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-md border border-ak-border bg-ak-surface p-2 font-mono text-[11px]"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${COLOR[s.agent]}`} />
                  <span className="font-semibold text-ak-foam">{s.agent}</span>
                </div>
                <div className="text-ak-graphite">
                  <span className="text-ak-blue">thought</span> · {s.thought}
                </div>
                <div className="text-ak-graphite">
                  <span className="text-[#f0b429]">action</span> · {s.action}
                </div>
                <div className="text-ak-graphite">
                  <span className="text-ak-green">observation</span> · {s.observation}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="rounded-md border border-ak-border bg-ak-midnight p-3">
        <div className="mb-1 font-mono text-[10px] text-ak-graphite">SharedContext.entries() · live</div>
        <pre className="font-mono text-[11px] text-ak-foam">
          {ctxEntries.length === 0 ? '{}' : JSON.stringify(Object.fromEntries(ctxEntries), null, 2)}
        </pre>
      </div>
    </div>
  )
}
