// Helper aliases for types: re-export local `src/types/*` under `@models/*`.
// Use `@models/*` in imports (e.g. `@models/mail`, `@models/config`).

declare module '@models/config' {
  export * from './config';
}

declare module '@models/mail' {
  export * from './mail';
}
