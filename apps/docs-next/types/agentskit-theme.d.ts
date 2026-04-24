// CSS side-effect imports exposed via package subpath exports
// (e.g. `import '@agentskit/react/theme'`) have no JS/TS types — declare them
// so `tsc --noEmit` in the Next build does not fail.
declare module '@agentskit/react/theme'
