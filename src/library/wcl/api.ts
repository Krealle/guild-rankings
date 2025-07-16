import { request, Variables } from "graphql-request";
import axios from "axios";
import { hash } from "ohash";
import { getCached, setCached } from "../cache";

async function fetchToken(): Promise<string | undefined> {
  const basicAuth = Buffer.from(
    `${process.env.WCL_CLIENT_ID}:${process.env.WCL_CLIENT_SECRET}`
  ).toString("base64");
  const response = await axios.postForm(
    `https://www.${process.env.WCL_PRIMARY_DOMAIN}/oauth/token`,
    {
      grant_type: "client_credentials",
    },
    {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
    }
  );

  return response.data?.access_token;
}

let accessToken: string | undefined = undefined;
async function getToken(force: boolean = false): Promise<string | undefined> {
  if (!force && accessToken) {
    return accessToken;
  }
  accessToken = await fetchToken();
  return accessToken;
}

const MAX_RETRIES = 1;

export async function queryWcl<T, V extends Variables>(
  gql: string,
  variables: V
): Promise<T> {
  let token = await getToken();
  if (!token) {
    throw new Error("No access token");
  }

  const run = () =>
    request<T>(
      `https://www.${process.env.WCL_PRIMARY_DOMAIN}/api/v2/client`,
      gql,
      variables,
      {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Encoding": "deflate,gzip",
      }
    );

  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      // Blindly reauthenticate and try again
      if (i === 1) token = await getToken(true);
      const data = await run();
      return data;
    } catch (error) {
      if (i !== MAX_RETRIES) continue;
      throw error;
    }
  }

  throw new Error("Something went wrong, Xeph pls fix");
}

export async function queryWclWithCache<T, V extends Variables>(
  keyPrefix: string,
  query: string,
  variables: V,
  ttl?: number
): Promise<T> {
  const cacheKey = `${keyPrefix}:${hash(variables)}`;

  try {
    const cached = await getCached<T>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await queryWcl<T, V>(query, variables);

    await setCached(cacheKey, data, ttl);

    return data;
  } catch (err) {
    throw err;
  }
}
