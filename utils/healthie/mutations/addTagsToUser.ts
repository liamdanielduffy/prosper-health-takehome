import { request } from '../request'
import { HealthieTag, HealthieUser } from '../types'

/*
{
  "data": {
    "bulkApply": {
      "tags": [
        {
          "id": "2096",
          "name": "testTag",
          "tagged_users": [
            {
              "id": "862720",
              "email": "test@test.com"
            }
          ]
        }
      ]
    }
  }
}
*/

interface TagWithUser extends HealthieTag {
  tagged_users: HealthieUser[]
}

type Response = {
  data: {
    bulkApply: {
      tags: TagWithUser[]
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
          }
        }
      }
    }
  `
  const res = await request<Response>(query)
  return res.data.bulkApply.tags
}