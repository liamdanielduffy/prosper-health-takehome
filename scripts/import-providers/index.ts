import _ from "lodash"
import { addStatesAndMetadataToUsers, getProvidersFromCsv, mergeProvidersWithOrgUsers, tagUsers } from "./utils"
import { getOrganization } from "@/services/healthie-api/utils/getOrganization"

(async function () {

  console.log('reading providers...')
  const providers = await getProvidersFromCsv()

  console.log('fetching organization...')
  const organization = await getOrganization()

  console.log('importing providers...')
  const users = await mergeProvidersWithOrgUsers(organization, providers)
  const usersByEmail = _.keyBy(users, 'email')

  console.log('tagging users...')
  await tagUsers(organization, providers, usersByEmail)

  console.log('adding states, gender, and bio to users...')
  await addStatesAndMetadataToUsers(providers, usersByEmail)
})()