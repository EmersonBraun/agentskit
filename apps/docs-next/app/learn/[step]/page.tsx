import Link from 'next/link'
import { notFound } from 'next/navigation'
import { STEPS } from '@/lib/learn-steps'
import { Stepper, MarkStepDone } from '@/components/learn/stepper'
import { Playground } from '@/components/mdx/playground'

export function generateStaticParams() {
  return STEPS.map((s) => ({ step: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params
  const s = STEPS.find((x) => x.slug === step)
  if (!s) return { title: 'Learn AgentsKit' }
  return { title: `${s.title} — Learn AgentsKit`, description: s.intro }
}

function renderBody(body: string) {
  const blocks: { type: 'code' | 'text'; lang?: string; text: string }[] = []
  const re = /```(\w+)?\n([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(body))) {
    if (m.index > last) blocks.push({ type: 'text', text: body.slice(last, m.index) })
    blocks.push({ type: 'code', lang: m[1] ?? 'text', text: m[2] })
    last = m.index + m[0].length
  }
  if (last < body.length) blocks.push({ type: 'text', text: body.slice(last) })
  return blocks.map((b, i) =>
    b.type === 'code' ? (
      <pre
        key={i}
        className="my-4 overflow-x-auto rounded-lg border border-ak-border bg-ak-midnight p-4 font-mono text-sm text-ak-foam"
      >
        <code>{b.text}</code>
      </pre>
    ) : (
      <p key={i} className="my-3 whitespace-pre-wrap text-ak-graphite">
        {b.text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
          part.startsWith('**') ? (
            <strong key={j} className="text-white">
              {part.slice(2, -2)}
            </strong>
          ) : (
            part
          ),
        )}
      </p>
    ),
  )
}

export default async function StepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params
  const s = STEPS.find((x) => x.slug === step)
  if (!s) notFound()
  const idx = STEPS.indexOf(s)
  const prev = STEPS[idx - 1]
  const next = STEPS[idx + 1]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-10 md:flex-row">
        <Stepper activeSlug={s.slug} />
        <article className="flex-1">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-ak-foam">
            Step {idx + 1} / {STEPS.length}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{s.title}</h1>
          <p className="mt-3 text-lg text-ak-graphite">{s.intro}</p>
          <div className="mt-6">{renderBody(s.body)}</div>

          {s.files ? (
            <div className="mt-8">
              <Playground files={s.files} entry={s.entry} eager title="Try it live" />
            </div>
          ) : null}

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-ak-border pt-6">
            {prev ? (
              <Link
                href={`/learn/${prev.slug}`}
                className="text-sm text-ak-graphite hover:text-ak-foam"
              >
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            <MarkStepDone stepKey={s.key} />
            {next ? (
              <Link
                href={`/learn/${next.slug}`}
                className="text-sm font-semibold text-ak-foam hover:text-white"
              >
                {next.title} →
              </Link>
            ) : (
              <Link href="/docs" className="text-sm font-semibold text-ak-foam hover:text-white">
                Read the docs →
              </Link>
            )}
          </div>
        </article>
      </div>
    </main>
  )
}
