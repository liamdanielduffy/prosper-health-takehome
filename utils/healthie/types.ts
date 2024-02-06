export interface HealthieStateLicense {
  id: string
  state: string
}

export interface HealthieUser {
  id: string,
  email: string,
  first_name: string,
  last_name: string
  metadata: string
  state_licenses: HealthieStateLicense[]
}
export interface HealthieTag {
  id: string,
  name: string
}