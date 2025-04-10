# Effect Monorepo Template

This template provides a solid foundation for building scalable and maintainable TypeScript applications with Effect. 

## Running Code

Bun: Typescript server and any ts + js files can be run directly without a build step  

To execute a file: 

```shr
bun ./path/to/the/file.ts
```

Pnpm, yarn , npm:
This template leverages [tsx](https://tsx.is) to allow execution of TypeScript files via NodeJS as if they were written in plain JavaScript.

To execute a file with `tsx`:

```sh
pnpm tsx ./path/to/the/file.ts
```

## Operations

**Run dev server**
```sh
bun run --cwd packages/server dev
```

**Building**

To build all packages in the monorepo:

```sh
bun build
```

**Testing**

To test all packages in the monorepo:

```sh
bun test
```

