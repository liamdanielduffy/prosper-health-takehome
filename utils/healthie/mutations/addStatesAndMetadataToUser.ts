import { stringifyWithEscapedQuotes } from "../../json"
import { request } from "../request"
import { HealthieUser } from "../types"

type Response = {
  data: {
    updateOrganizationMember: {
      user: HealthieUser
    }
  }
}

export async function addStatesAndMetadataToUser(states: string[], metadata: Record<string, string>, userId: string) {
  const stateLicenses = states.map(state => `{ state: "${state}"}`).join(',')
  const query = `
    mutation {
      updateOrganizationMember(input: {
        id: "${userId}"
        state_licenses: [ ${stateLicenses} ]
        metadata: "${stringifyWithEscapedQuotes(metadata)}"
      }) {
        user {
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
  `
  const res = await request<Response>(query)
  return res.data.updateOrganizationMember.user
}