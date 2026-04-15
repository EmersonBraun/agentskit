import './animated-logo.css'

type Variant = 'nav' | 'hero' | 'footer'

export function AnimatedLogo({
  size = 22,
  variant = 'nav',
  loop = false,
}: {
  size?: number
  variant?: Variant
  loop?: boolean
}) {
  const h = Math.round((size * 64) / 72)
  const cls = `ak-logo ak-logo--${variant}${loop ? ' ak-logo--loop' : ''}`
  return (
    <svg
      className={cls}
      width={size}
      height={h}
      viewBox="0 0 72 64"
      fill="none"
      aria-hidden="true"
    >
      <line
        className="ak-logo__line ak-logo__line--1"
        x1="12"
        y1="52"
        x2="36"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        className="ak-logo__line ak-logo__line--2"
        x1="36"
        y1="12"
        x2="60"
        y2="52"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        className="ak-logo__line ak-logo__line--3"
        x1="12"
        y1="52"
        x2="60"
        y2="52"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle className="ak-logo__dot ak-logo__dot--top" cx="36" cy="12" r="6" fill="currentColor" />
      <circle className="ak-logo__dot ak-logo__dot--left" cx="12" cy="52" r="6" fill="currentColor" />
      <circle className="ak-logo__dot ak-logo__dot--right" cx="60" cy="52" r="6" fill="currentColor" />
    </svg>
  )
}
