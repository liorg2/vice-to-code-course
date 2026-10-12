import { createFrankfurterSource } from "./frankfurter.ts";
import { handleRequest } from "./handler.ts";

type HttpEvent = {
  rawPath: string;
  queryStringParameters?: Record<string, string | undefined>;
  headers?: Record<string, string | undefined>;
  requestContext: { http: { method: string } };
};

const source = createFrankfurterSource();

export async function handler(event: HttpEvent) {
  const result = await handleRequest(
    {
      method: event.requestContext.http.method,
      path: event.rawPath,
      query: event.queryStringParameters ?? {},
      headers: event.headers,
    },
    { source },
  );
  return {
    statusCode: result.status,
    headers: result.headers,
    body: result.status === 204 ? undefined : JSON.stringify(result.body),
  };
}
