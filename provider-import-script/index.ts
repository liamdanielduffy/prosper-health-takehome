import { getOrganization } from './utils/healthie';
import { getProvidersFromCsv } from './utils/providers';

getProvidersFromCsv().then(console.log).then(getOrganization).then(console.log)