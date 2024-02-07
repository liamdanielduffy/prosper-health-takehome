import { stringifyWithEscapedQuotes } from "@/utils/json"
import { HealthieUser } from "../types"
import { sendGraphQLRequest } from "./sendGraphQLRequest"

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
          active_tags {
            name
          }
        }
      }
    }
  `
  const res = await sendGraphQLRequest<Response>(query)
  return res.data.updateOrganizationMember.user
}