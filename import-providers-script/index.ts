import { keyBy } from "lodash"
import { addStatesAndMetadataToUsers, applyTagsToProviders, createPsypacTag, createTagsForClinicianTypes, createTagsForInsurances, createUsersFromProviders, getProviders, mergeProvidersWithOrgUsers, tagUsers } from "./utils"
import { getOrganization } from "@/healthie-api/utils/getOrganization"

(async function () {

  console.log('reading providers...')
  const providers = await getProviders()

  console.log('fetching organization...')
  const organization = await getOrganization()

  console.log('importing providers...')
  const users = await mergeProvidersWithOrgUsers(organization, providers)
  const usersByEmail = keyBy(users, 'email')

  console.log('tagging users...')
  await tagUsers(organization, providers, usersByEmail)

  console.log('adding states, gender, and bio to users...')
  await addStatesAndMetadataToUsers(providers, usersByEmail)
})()