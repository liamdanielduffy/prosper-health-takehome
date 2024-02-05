import { getEnv } from "../env"

export async function request<Response>(query: string): Promise<Response> {
  const res = await fetch(getEnv().HEALTHIE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${getEnv().HEALTHIE_API_KEY}`,
      "AuthorizationSource": "API"
    },
    body: JSON.stringify({ query })
  })
  const resBody = await res.json()
  return resBody as Response
}