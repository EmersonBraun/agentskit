import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment'

type Plausible = (event: string, options?: { props?: Record<string, string> }) => void

if (ExecutionEnvironment.canUseDOM) {
  document.addEventListener(
    'click',
    (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-ak-cta]')
      if (!el) return
      const name = el.getAttribute('data-ak-cta')
      if (!name) return
      const w = window as typeof window & { plausible?: Plausible }
      w.plausible?.('cta_click', { props: { cta: name } })
    },
    { capture: true },
  )
}

export default function clientModule(): void {}
