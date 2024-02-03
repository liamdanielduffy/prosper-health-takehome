export interface RawProviderData {
  first_name: string,
  last_name: string,
  accepted_insurances: string,
  psypact: string,
  biography: string,
  gender: string
}

export interface Provider {
  first_name: string,
  last_name: string,
  accepted_insurances: string[]
  psypact: boolean,
  biography: string,
  gender: string
}