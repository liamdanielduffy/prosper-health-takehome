import { HealthieOrganization } from '../types'
import { sendGraphQLRequest } from './sendGraphQLRequest'

type Response = {
  data: {
    organization: HealthieOrganization
  }
}

export async function getOrganization() {
  const res = await sendGraphQLRequest<Response>(`
    {
      organization {
        id
        tags {
          id
          name
        }
        organization_memberships {
          id
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
    }`)
  return res.data.organization
}