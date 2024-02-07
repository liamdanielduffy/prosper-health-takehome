export interface RawProviderData {
  first_name: string
  last_name: string
  states_licensed: string
  clinician_type: 'PSYCHOLOGIST' | 'THERAPIST'
  accepted_insurances: string
  email: string
  psypact: string
  biography: string
  gender: string
}

export interface Provider {
  first_name: string
  last_name: string
  email: string
  states_licensed: string[]
  clinician_type: 'PSYCHOLOGIST' | 'THERAPIST'
  accepted_insurances: string[]
  psypact: boolean
  biography: string
  gender: string
}