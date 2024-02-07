import { HealthieUser } from "@/services/healthie-api/types"
import { ACCEPTED_INSURANCES, STATES_ALLOWING_THERAPY_AND_INSURANCE, STATES_DISALLOWING_ASSESSMENT, UNINSURED_ASSESSMENT_COST_IN_DOLLARS, UNINSURED_THERAPY_COST_IN_DOLLARS } from "./constants"
import { Client, ClientConstraints, HealthieUserWithMetadata, ProviderWithCost } from "./types"
import { Provider } from '@/scripts/import-providers/types'
import { getOrganization } from "@/services/healthie-api/utils/getOrganization"
import { getProvidersFromCsv } from "@/scripts/import-providers/utils"
import { readCsvFile } from "@/utils/csv"
import _ from "lodash"

function getClientConstraints(client: Client): ClientConstraints {
  return {
    wantsAssessment: client.desired_service === 'assessment',
    wantsTherapy: client.desired_service === 'therapy',
    canUseInsurance: STATES_ALLOWING_THERAPY_AND_INSURANCE.includes(client.state) && ACCEPTED_INSURANCES.includes(client.insurance),
    canReceiveTherapy: STATES_ALLOWING_THERAPY_AND_INSURANCE.includes(client.state),
    canReceiveAssessment: !STATES_DISALLOWING_ASSESSMENT.includes(client.state)
  }
}

function getUninsuredProviderCost(provider: Provider) {
  switch (provider.clinician_type) {
    case 'PSYCHOLOGIST':
      return UNINSURED_ASSESSMENT_COST_IN_DOLLARS
    case 'THERAPIST':
      return UNINSURED_THERAPY_COST_IN_DOLLARS
    default:
      return 0
  }
}

function getProvidersForClient(providers: Provider[], client: Client) {
  const constraints = getClientConstraints(client)
  return providers.filter(p => {
    return (
      (constraints.wantsAssessment && p.clinician_type === 'PSYCHOLOGIST')
      || (constraints.wantsTherapy && p.clinician_type === 'THERAPIST')
    )
  })
}

function getProviderCostForClient(provider: Provider, client: Client): number {
  const constraints = getClientConstraints(client)
  const providerAcceptsClientInsurance = provider.accepted_insurances.includes(client.insurance)
  if (!providerAcceptsClientInsurance || !constraints.canUseInsurance) {
    return getUninsuredProviderCost(provider)
  }
  return 0
}

function getUsersWithMetadata(users: HealthieUser[]): HealthieUserWithMetadata[] {
  const usersWithMetadata: HealthieUserWithMetadata[] = users.map(u => ({ ...u, metadata: JSON.parse(u.metadata) }))
  return usersWithMetadata
}

function getProvidersWithCosts(providers: Provider[], client: Client): ProviderWithCost[] {
  const providersWithCosts = providers.map(p => ({ ...p, costInDollars: getProviderCostForClient(p, client) }))
  return providersWithCosts
}

function getProviderFromUser(user: HealthieUserWithMetadata): Provider {
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    states_licensed: user.state_licenses.map(l => l.state),
    clinician_type: user.active_tags.some(t => t.name === 'PSYCHOLOGIST') ? 'PSYCHOLOGIST' : 'THERAPIST',
    accepted_insurances: user.active_tags.map(t => t.name).filter(ins => ins === 'BCBS' || ins === 'Aetna'),
    psypact: user.active_tags.some(t => t.name === 'PSYPACT'),
    biography: user.metadata.biography,
    gender: user.metadata.gender
  }
}


async function getUsers(): Promise<HealthieUserWithMetadata[]> {
  const organization = await getOrganization()
  const providersFromCsv = await getProvidersFromCsv()

  //filter out users
  const realUsers = organization.organization_memberships
    .map(m => m.user)
    .filter(u =>
      providersFromCsv.some(p => p.email === u.email))

  return getUsersWithMetadata(realUsers)
}

export async function getRandomClient(): Promise<Client | undefined> {
  const allClients = await readCsvFile<Client, Client>('data/prospective_clients.csv', row => row)
  const client = _.sample(allClients)
  return client
}

export async function getProviders(client: Client): Promise<ProviderWithCost[]> {
  const users = await getUsers()
  const providersFromApi = users.map(u => getProviderFromUser(u))
  const providersForClient = getProvidersForClient(providersFromApi, client)
  const providersWithCosts = getProvidersWithCosts(providersForClient, client)
  return providersWithCosts
}