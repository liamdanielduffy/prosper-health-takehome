import { keyBy } from "lodash"
import { addStatesAndMetadataToUsers, applyTagsToProviders, createPsypacTag, createTagsForClinicianTypes, createTagsForInsurances, createUsersFromProviders, getProviders } from "./utils"
import { getOrganization } from "@/healthie-api/utils/getOrganization"

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
  const newUsers = await createUsersFromProviders(providersToImport, organization.id)
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