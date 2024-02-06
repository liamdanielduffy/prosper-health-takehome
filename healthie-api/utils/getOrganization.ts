import { HealthieTag, HealthieUser } from '../types'
import { sendGraphQLRequest } from './sendGraphQLRequest'

type Response = {
  data: {
    organization: {
      id: string,
      tags: HealthieTag[]
      organization_memberships: {
        id: string,
        user: HealthieUser
      }[]
    }
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