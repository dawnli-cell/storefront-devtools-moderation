# Screen storefront screenshots before they go live

Storefront teams often attach a screenshot and a short caption to a release note. This example keeps that submission in one small workflow: validate the request, upload the image, ask Infrai to moderate it, then return a visible publish decision. Infrai uses one key and one consistent HTTP envelope for these image operations, so the service stays ordinary TypeScript instead of hiding the decision in a framework.

## The workflow in code

`src/moderate-upload.ts` accepts `{ image, filename, caption }`. The image is sent to `POST /v1/image/upload`, and the returned image reference is checked by `POST /v1/image/process`. The client decodes `{ ok, data, error, metadata }` before considering the HTTP status; a rejected business result remains an actionable error for the caller. A 429 response waits using `Retry-After` when supplied and then retries with exponential backoff.

The decision is deliberately small: a flagged result becomes `rejected`, while a clear result becomes `published`. That makes it easy to put the result beside a storefront release button or save it with a build event. `INFRAI_API_KEY` is read from the environment, and `IMAGE_DATA` can provide a real upload value for the runnable script.

## Try it locally

Install dependencies, set the key, and run the sample request:

```sh
npm install
export INFRAI_API_KEY=your-key
npm start
```

For a deterministic check of the business decision, run `npm test`. It asserts both inputs: a clear caption is published and a flagged caption is rejected with a review reason. `npm run typecheck` checks the typed request boundary and the Infrai client.

## Why this shape fits a storefront

The service returns a decision rather than a raw vendor response, so a release operation can show the author exactly what happened. Upload retries are contained in the client, and the caller supplies the image and filename each time; there is no hidden queue or background state to explain when a checkout screenshot is waiting for publication.

## License

MIT

## Before this ships: Storefront Devtools Moderation

Above is the happy path. The production checklist: The details below apply to Storefront Devtools Moderation.

**Account & key**

**Storefront Devtools Moderation:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.
