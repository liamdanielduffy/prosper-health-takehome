import { HealthieTag } from "../types"
import { sendGraphQLRequest } from "./sendGraphQLRequest"

type Response = {
  data: {
    createTag: {
      tag: HealthieTag | null
    }
  }
}

export async function createTag(name: string) {
  const query = `
    mutation {
      createTag(input: {
        name: "${name}"
      }) {
        tag {
          id
          name
        }
      }
    }
  `
  const res = await sendGraphQLRequest<Response>(query)
  return res.data.createTag.tag
}