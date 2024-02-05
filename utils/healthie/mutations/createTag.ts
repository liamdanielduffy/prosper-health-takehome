import { request } from "../request"
import { HealthieTag } from "../types"

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
  const res = await request<Response>(query)
  return res.data.createTag.tag
}