interface EnvironmentVariables {
  HEALTHIE_API_KEY: string,
  HEALTHIE_GRAPHQL_ENDPOINT: string
}

export function getEnv(): EnvironmentVariables {
  return {
    HEALTHIE_API_KEY: process.env.HEALTHIE_API_KEY as string,
    HEALTHIE_GRAPHQL_ENDPOINT: process.env.HEALTHIE_GRAPHQL_ENDPOINT as string,
  };
}