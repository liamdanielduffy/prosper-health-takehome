import { sendGraphQLRequest } from "./sendGraphQLRequest"
import { HealthieUser } from "../types"

type Response = {
  data: {
    createOrganizationMembership: {
      organizationMembership: {
        user: HealthieUser
      } | null
    }
  }
}

export async function createOrganizationMembership(
  user: { email: string, first_name: string, last_name: string },
  organizationId: string
) {

  const query = `
    mutation {
      createOrganizationMembership(input: {
        organization_id: "${organizationId}"
        email: "${user.email}"
        first_name: "${user.first_name}"
        last_name: "${user.last_name}"
      }) {
        organizationMembership {
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
    }
  `
  const res = await sendGraphQLRequest<Response>(query)
  return res.data.createOrganizationMembership.organizationMembership
}
