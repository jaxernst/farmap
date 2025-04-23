# Farmap - map-based photo sharing on Farcaster

Upload photos to the global map and share them in your social-feed via Farcaster mini-app links

![Farmap Preview](/farmap-preview.png)

Built as a Farcaster mini app with Effect TS + SvelteKit

[Effect is cool and you should use it](https://effect.website/)

[Mini apps are cool and you should use them](https://miniapps.farcaster.xyz/)

# Why Effect

Effect is a powerful TypeScript library/meta-language heavily inspired by functional programming. It provides a unified approach for handling asynchronous operations, type-safe error handling, resource management, first class dependency injection, and much more.

Effect has powerful tools for managing dependencies and runtime requirements for applications. This makes it easy to write code that is minimally coupled and maximally maintainable while preserving type safety and error safety across the stack. I've compiled some notes about the structure of this monorepo to highlight some of strengths and unpack the system:

## packages/domain -> Defines all types, schemas, and interfaces for Farmap

- Common place to define Effect 'tags' which are essentially dependency injectable interfaces. Tags can represent data OR functionality
- App services and modules can use these tag definitions without knowledge of the live implementation
- Contains data model and api type definitions with two way schemas for encoding <> decoding all data types used through the application
- Contains the cannonical REST api definition (distinct from the implementation) which includes all possible return types, error types, status codes, etc. This makes it trivial to maintain type safety between client and server implementations

## packages/ui -> SvelteKit application

- Using Leaflet for the map UI, Mapbox for the map tiles
- Client api: Uses the Api defintion from packages/domain to create a fully type safe api-client. Different HttpClient implementations can be injected for use in the browser or on trusted server-rendered routes (browser httpclient vs node http client - other platform implementations are supported as well)
- Using server side rendering for photo sharing routes: These 'share' routes will generate a social preview composite image of the mini map + original photo and place these image urls in metadata for opengraph and mini app presentation

## packages/server -> Effect http server (no backend framework, just effect)

- index.ts is where all the 'live' implementations get composed together and served. This entrypoint is where all the services and interfaces get their implementations injected

#### Generic interfaces + live implementations (generally defined in packages/domain and implemented in /packages/server):

- Db layer: Implemented with Sqlite
- Farcaster layer: Implemented with a Pinata Farcaster hub client
- File storage layer: Implemented with an AWS S3 client

#### Domain-specific services (high level abstractions that use the generic interfaces):

- UserService, AuthService, MapAttachmentService, MapQueryService, SocialPreviewService

# Running Code

Pnpm, yarn , npm:
This template leverages [tsx](https://tsx.is) to allow execution of TypeScript files via NodeJS as if they were written in plain JavaScript.

To execute a file with `tsx`:

```sh
pnpm tsx ./path/to/the/file.ts
```

## Run the dev servers:

Start the node server and Sveltekit server:
`pnpm dev`

## Running in the mini-app environment

Any mini app using the mini app SDK can be previewed by running your ui dev server through an https tunnel and previewing it on Warpcast via their dev tools page:
[Mini app dev tools](https://warpcast.com/~/developers/mini-apps/preview)

See the mini app docs for more info.
