import { HealthieUser } from "../types"
import { sendGraphQLRequest } from "./sendGraphQLRequest"

type Response = {
  data: {
    updateOrganizationMember: {
      user: HealthieUser
    }
  }
}

export async function removeStatesFromUser(user: HealthieUser) {
  const stateLicenses = user.state_licenses.map(l => `{ state: "${l.state}", id: "${l.id}", _destroy: true }`).join(',')
  const query = `
    mutation {
      updateOrganizationMember(input: {
        id: "${user.id}"
        state_licenses: [ ${stateLicenses} ]
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