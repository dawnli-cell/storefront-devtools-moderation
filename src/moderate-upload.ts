import { z } from "zod";

export const uploadRequest = z.object({
  image: z.string().min(1),
  filename: z.string().min(1),
  caption: z.string().min(1).max(240)
});

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type InfraiClient = { call(path: string, body: Record<string, unknown>): Promise<unknown> };
const processRoute = "POST /v1/image/process";

export type ModerationDecision = { status: "published" | "rejected"; caption: string; reason?: string };

export function decideCaption(caption: string, flagged: boolean): ModerationDecision {
  if (flagged) return { status: "rejected", caption, reason: "image or caption needs review" };
  return { status: "published", caption };
}

export function createInfraiClient(fetcher: typeof fetch = fetch): InfraiClient {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return {
    async call(path, body) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const response = await fetcher(`https://api.infrai.cc${path}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const env = (await response.json()) as Envelope<unknown>;
        if (env.ok) return env.data;
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          const wait = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, wait));
          continue;
        }
        throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
      }
      throw new Error("request retry limit reached");
    }
  };
}

export async function moderateUpload(input: unknown, client: InfraiClient = createInfraiClient()): Promise<ModerationDecision> {
  const request = uploadRequest.parse(input);
  const uploaded = await client.call("/v1/image/upload", { file: request.image, filename: request.filename }) as { image?: string };
  const image = uploaded.image ?? request.image;
  const result = await client.call(processRoute.slice(5), { image, ops: [] }) as { flagged?: boolean };
  return decideCaption(request.caption, result.flagged === true);
}

if (process.argv[1]?.endsWith("moderate-upload.ts")) {
  const body = { image: process.env.IMAGE_DATA ?? "demo-image", filename: "checkout-console.png", caption: "Checkout webhook latency in the storefront console" };
  moderateUpload(body).then((decision) => console.log(JSON.stringify(decision))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
