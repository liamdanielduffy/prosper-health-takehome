import { addStatesAndMetadataToUser } from '@/services/healthie-api/utils/addStatesAndMetadataToUser';
import { addTagsToUser } from '@/services/healthie-api/utils/addTagsToUser';
import { createOrganizationMembership } from '@/services/healthie-api/utils/createOrganizationMembership';
import { createTag } from '@/services/healthie-api/utils/createTag';
import { removeStatesFromUser } from '@/services/healthie-api/utils/removeStatesFromUser';
import { HealthieOrganization, HealthieTag, HealthieUser } from '@/services/healthie-api/types';
import { compact, flatten, uniq, Dictionary, difference, keyBy } from 'lodash'
import { readCsvFile } from '@/utils/csv';
import { Provider, RawProviderData } from './types';
import { PROVIDERS_DATA_FILE_PATH, PSYPACT_TAG_NAME } from './constants';

function parseProviderData(data: RawProviderData): Provider {
  return {
    ...data,
    states_licensed: data.states_licensed.split(';'),
    accepted_insurances: data.accepted_insurances.split(';'),
    psypact: data.psypact === 'True' ? true : false
  }
}

export async function getProviders(): Promise<Provider[]> {
  return readCsvFile<RawProviderData, Provider>(PROVIDERS_DATA_FILE_PATH, parseProviderData)
}

export async function createUsersFromProviders(providers: Provider[], organizationId: string) {
  const requests = providers.map(p => createOrganizationMembership(p, organizationId))
  const memberships = compact(await Promise.all(requests))
  const users = memberships.map(m => m.user)
  return users
}

export async function createTagsForClinicianTypes(providers: Provider[]) {
  const clinicianTypes = uniq(providers.map(p => p.clinician_type))
  const requests = clinicianTypes.map(t => createTag(t))
  const tags = compact(await Promise.all(requests))
  return tags
}

export async function createTagsForInsurances(providers: Provider[]) {
  const insurances = uniq(flatten(providers.map(p => p.accepted_insurances)))
  const requests = insurances.map(t => createTag(t))
  const tags = compact(await Promise.all(requests))
  return tags
}

export async function createPsypacTag() {
  return createTag(PSYPACT_TAG_NAME)
}

export function getTagsForProvider(provider: Provider, tagsByName: Dictionary<HealthieTag>) {
  const clinicianTypeTag = tagsByName[provider.clinician_type]
  const insuranceTags = compact(provider.accepted_insurances.map(ins => tagsByName[ins]))
  const psypactTag = provider.psypact ? tagsByName[PSYPACT_TAG_NAME] : null
  const tags = insuranceTags
  if (clinicianTypeTag) {
    tags.push(clinicianTypeTag)
  }
  if (psypactTag) {
    tags.push(psypactTag)
  }
  return tags
}

export async function applyTagsToProviders(providers: Provider[], tagsByName: Dictionary<HealthieTag>, usersByEmail: Dictionary<HealthieUser>): Promise<TagWithUsers[][]> {
  const requests = providers.map(p => {
    const tagIds = getTagsForProvider(p, tagsByName).map(t => t.id)
    const userId = usersByEmail[p.email].id
    return addTagsToUser(tagIds, userId)
  })
  const tagsWithUsers = compact(await Promise.all(requests))
  return tagsWithUsers
}

export async function addStatesAndMetadataToUsers(providers: Provider[], usersByEmail: Dictionary<HealthieUser>) {
  const requests = providers.map(p => {
    const providerStates = p.states_licensed
    const user = usersByEmail[p.email]
    const userStates = user.state_licenses.map(s => s.state)
    const statesToAdd = difference(providerStates, userStates)
    return addStatesAndMetadataToUser(statesToAdd, { gender: p.gender, biography: p.biography }, user.id)
  })
  const usersWithStates = compact(await Promise.all(requests))
  return usersWithStates
}

export async function removeStatesFromUsers(users: HealthieUser[]) {
  const requests = users.map(u => {
    return removeStatesFromUser(u)
  })
  const updatedUsers = compact(await Promise.all(requests))
  return updatedUsers
}

export async function mergeProvidersWithOrgUsers(organization: HealthieOrganization, providers: Provider[]): Promise<HealthieUser[]> {
  const memberships = organization.organization_memberships
  const providersByEmail = keyBy(providers, 'email')
  const importedUsers = memberships.map(m => m.user).filter(u => providersByEmail[u.email])
  const importedUsersByEmail = keyBy(importedUsers, 'email')
  const providersToImport = providers.filter(p => !importedUsersByEmail[p.email])
  const newUsers = await createUsersFromProviders(providersToImport, organization.id)
  const users = [...importedUsers, ...newUsers]
  return users
}

export async function tagUsers(organization: HealthieOrganization, providers: Provider[], usersByEmail: Dictionary<HealthieUser>) {
  const existingTags = organization.tags
  const newClinicianTypeTags = await createTagsForClinicianTypes(providers)
  const newInsuranceTags = await createTagsForInsurances(providers)
  const psypacTag = await createPsypacTag()

  const allTags = [
    ...(psypacTag ? [psypacTag] : []),
    ...existingTags,
    ...newClinicianTypeTags,
    ...newInsuranceTags
  ]
  const tagsByName = keyBy(allTags, 'name')
  await applyTagsToProviders(providers, tagsByName, usersByEmail)
}