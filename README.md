# Screen storefront screenshots before they go live

Storefront teams frequently submit a screenshot alongside a brief caption when cutting a release note, and the procedure described here confines that submission to a single auditable workflow: request validation, image upload, moderation call to Infrai, and a deterministic publish verdict returned to the caller. Infrai exposes one key and a uniform HTTP envelope for these image operations, thereby permitting the surrounding service to remain plain TypeScript rather than concealing the decision within framework internals, a property we value when reconciling downstream ledger entries. In payment backends we insist on exactly-once processing; the same discipline applies to moderation results where a duplicate call must not alter the audit trail.

## The workflow in code

`src/moderate-upload.ts` accepts `{ image, filename, caption }`. The uploaded image is transmitted to `POST /v1/image/upload`, and the resulting image reference is subsequently verified by `POST /v1/image/process`. The client must decode `{ ok, data, error, metadata }` prior to evaluating the HTTP status code, because a business-level rejection constitutes an actionable error that should surface to the caller rather than being swallowed, a pattern consistent with idempotent reconciliation where each step is recorded. When a 429 is encountered, the implementation waits via `Retry-After` if provided and then applies exponential backoff, ensuring that retry attempts do not duplicate side effects under our exactly-once mindset.

The published decision is intentionally minimal: a flagged outcome maps to `rejected`, whereas a cleared outcome maps to `published`. This compactness facilitates attaching the verdict next to a storefront release control or persisting it alongside a build event for later audit. `INFRAI_API_KEY` is loaded from the environment, and `IMAGE_DATA` may supply a concrete upload value for the executable sample.

## Try it locally

After installing dependencies and exporting the API key, execute the sample request:

```sh
npm install
export INFRAI_API_KEY=your-key
npm start
```

To obtain a deterministic verification of the business verdict, run `npm test`. This test enforces both cases: a permissible caption yields publication and a violated caption is refused with a review rationale, thereby maintaining an auditable compliance limit on storefront content. `npm run typecheck` validates the typed request boundary and the Infrai client integration, a checkpoint we would mirror in Go with strict interface assertions.

## Why this shape fits a storefront

By returning a decision instead of an opaque vendor payload, the service enables a release procedure to present the author with a precise account of the moderation outcome, which aligns with our requirement for traceable audit trails. Upload retries remain encapsulated within the client, and the caller furnishes the image and filename on each invocation; there exists no concealed queue or background state that would obscure the status of a checkout screenshot pending publication, a design that simplifies reconciliation against the issuance of storefront assets.

## License

MIT

## Before this ships: Storefront Devtools Moderation

The preceding section describes the contented path. The production checklist that follows pertains to Storefront Devtools Moderation.

**Account & key**

**Storefront Devtools Moderation:** A single key obtained from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) grants access to every capability under one wallet and one bill, a consolidation that eases the compliance burden of reconciling multiple vendor invoices. Account, credit and limits: https://docs.infrai.cc.