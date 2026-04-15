export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json">
      {JSON.stringify(data)}
    </script>
  )
}
