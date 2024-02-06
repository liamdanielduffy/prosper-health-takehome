import { addStatesAndMetadataToUser } from '../utils/healthie/mutations/addStatesAndMetadataToUser';
import { addTagsToUser } from '../utils/healthie/mutations/addTagsToUser';
import { createOrganizationMembership } from '../utils/healthie/mutations/createOrganizationMembership';
import { createTag } from '../utils/healthie/mutations/createTag';
import { removeStatesFromUser } from '../utils/healthie/mutations/removeStatesFromUser';
import { getOrganization } from '../utils/healthie/queries/getOrganization';
import { HealthieTag, HealthieUser } from '../utils/healthie/types';
import { Provider, getProviders } from '../utils/providers';
import { keyBy, compact, flatten, uniq, Dictionary, difference } from 'lodash'

const PSYPACT_TAG_NAME = 'PSYPACT'

async function importProviders(providers: Provider[], organizationId: string) {
  const requests = providers.map(p => createOrganizationMembership(p, organizationId))
  const memberships = compact(await Promise.all(requests))
  const users = memberships.map(m => m.user)
  return users
}

async function createTagsForClinicianTypes(providers: Provider[]) {
  const clinicianTypes = uniq(providers.map(p => p.clinician_type))
  const requests = clinicianTypes.map(t => createTag(t))
  const tags = compact(await Promise.all(requests))
  return tags
}

async function createTagsForInsurances(providers: Provider[]) {
  const insurances = uniq(flatten(providers.map(p => p.accepted_insurances)))
  const requests = insurances.map(t => createTag(t))
  const tags = compact(await Promise.all(requests))
  return tags
}

async function createPsypacTag() {
  return createTag(PSYPACT_TAG_NAME)
}

function getTagsForProvider(provider: Provider, tagsByName: Dictionary<HealthieTag>) {
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

async function applyTagsToProviders(providers: Provider[], tagsByName: Dictionary<HealthieTag>, usersByEmail: Dictionary<HealthieUser>) {
  const requests = providers.map(p => {
    const tagIds = getTagsForProvider(p, tagsByName).map(t => t.id)
    const userId = usersByEmail[p.email].id
    return addTagsToUser(tagIds, userId)
  })
  const tagsWithUsers = compact(await Promise.all(requests))
  return tagsWithUsers
}

async function addStatesAndMetadataToUsers(providers: Provider[], usersByEmail: Dictionary<HealthieUser>) {
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

async function removeStatesFromUsers(users: HealthieUser[]) {
  const requests = users.map(u => {
    return removeStatesFromUser(u)
  })
  const updatedUsers = compact(await Promise.all(requests))
  return updatedUsers
}

(async function () {

  console.log('reading providers...')
  const providers = await getProviders()
  const providersByEmail = keyBy(providers, 'email')

  console.log('fetching organization...')
  const organization = await getOrganization()
  const memberships = organization.organization_memberships
  const importedUsers = memberships.map(m => m.user).filter(u => providersByEmail[u.email])
  const importedUsersByEmail = keyBy(importedUsers, 'email')

  console.log('importing providers...')
  const providersToImport = providers.filter(p => !importedUsersByEmail[p.email])
  const newUsers = await importProviders(providersToImport, organization.id)
  const users = [...importedUsers, ...newUsers]
  const usersByEmail = keyBy(users, 'email')

  console.log('tagging users...')
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

  console.log('adding states, gender, and bio to users...')
  await addStatesAndMetadataToUsers(providers, usersByEmail)
})()