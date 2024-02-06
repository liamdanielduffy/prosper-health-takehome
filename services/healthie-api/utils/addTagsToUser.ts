import { HealthieTag, HealthieUser } from "../types"
import { sendGraphQLRequest } from "./sendGraphQLRequest"

interface TagWithUsers extends HealthieTag {
  tagged_users: HealthieUser[]
}

type Response = {
  data: {
    bulkApply: {
      tags: TagWithUsers[]
    }
  }
}

export async function addTagsToUser(tagIds: string[], userId: string) {
  const ids = tagIds.map(id => `"${id}"`).join(',')
  const query = `
    mutation {
      bulkApply(input: {
        ids: [${ids}]
        taggable_user_id: "${userId}"
      }) {
        tags {
          id
          name
          tagged_users {
            id
            first_name
            last_name
            email
            metadata
            state_licenses {
              id
              state
            }
          }
        }
      }
    }
  `
  const res = await sendGraphQLRequest<Response>(query)
  return res.data.bulkApply.tags
}