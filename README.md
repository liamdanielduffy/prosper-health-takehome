### Repo + App Setup

This repo was setup with Bun. 

To install dependencies for both the script and the app, run:

```
bun install
```

Create a `.env` file at the root with the following values:
```
HEALTHIE_GRAPHQL_ENDPOINT="..."
HEALTHIE_API_KEY="..."
```

To run the app locally:

```
bun dev
```

To run the script to import providers:

```
bun run import-providers
```

### Part 1 Notes

- The script for importing providers into Healthie lives in `scripts/import-providers/index.ts`

- I load a CSV-formatted string of providers from `data/clinical_roster.ts`, rather than reading from a CSV file, so I can re-use the same data + functions in a serverless environment where reading from the filesystem isn't supported (more on this in Part 2 Notes).

- The original CSV did not have an email for providers, but Healthie uses email as a uniqueness constraint on org memberships. I added my own emails to make it possible to uniquely identify providers after they'd been imported to Healthie.  

- The majority of logic for reading, parsing, and importing provider data lives in `scripts/import-providers/utils.ts`. 

- To call the Healthie API, I wrote wrapper functions for specific queries + mutations that live in `services/healthie-api/utils`

- I found that most Healthie API mutations were idempotent, so I wrote my script to rerun the same mutations each time it is run. There are some places I avoided sending mutations if I saw that the data had already been imported, but there are more places to optimize script performance. 

- One annoying case of non-idempotency was the `state_licences` field on `updateOrganizationMember`. A `state_license` object in the input with the same `name` as an existing `state_license` object on an existing org member is appended to the `state_licenses` array for that org member, meaning that you can easily create duplicate licenses for the same state. Ideally, I could find a mutation that allows me to create `state_licenses` as separate objects in the API, then attach them to users by ID. However, I wasn't able to find a mutation like that.

### Part 2 Notes

- While the app will load a random user by default, you can also append a `?userNum=N` query param to get the `nth` user in the CSV to show up, for testing purposes. 

- I opted to use a [Remix](https://remix.run) boilerplate to bootstrap the app instead of the Vite React template, to demonstrate how I would build this page in a production app. I wanted to be sure that sensitive data & API keys were handled entirely serverside, and that only the minimum necessary data was passed back to the client when loading the page. 

- The index route of my app is defined in `app/routes/_index.tsx`. The [loader](https://remix.run/docs/en/main/discussion/data-flow#route-loader) function runs serverside to fetch providers from the Healthie API, and prospective clients from a CSV string. 

- The majority of data loading + parsing logic lives in `app/utils.ts`

- Constant values relevant to business logic live in `app/constants.ts`

- There are some quirks of how I load data that I wanted to document here:

1. I re-read the providers CSV file, even though the data is already imported into Healthie. I did this in order to distinguish between test users and users I imported from the CSV. I tried to delete test users with `deleteOrganizationMembership`, but got an error message when running the mutation saying `"Organization Memberships cannot be destroyed"`. I wasn't sure whether this was true for all API calls, or just my token.  

2. I loaded a CSV-formatted string, rather than reading from a CSV file, since Vercel's serverless functions don't support storing files alongside source code. I'd need to use a Blob storage service to host the file. To avoid this, I copied the CSV data into strings. These are exported from `.ts` files inside the `data/` folder with the same names as the original CSV files.

3. I didn't end up using the `licensed_in_state` or `with_tag_ids` filters on the `providers` fragment of the `organization` query. I found that the query did not return the users which I'd expect to be returned given the filters. There might be something I missed which designates an org membership as a provider, so it can be returned as part of `providers`. As an example, this query returns only a test user existed before the CSV import, despite several imported users having an attached `state_license` with an `NY` value:

```
query {
  organization {
    providers(licensed_in_state: "NY") {
      id
      email
      state_licenses {
        state
      }
    }
  }
}
```

### Misc. Notes + Follow-Ups

- For the sake of time, I skipped the bookings part of this challenge. However, I would have imported these for providers with the `bulkCreateAvailability` mutation.

- In addition to the docs you sent, I found this [schema explorer](https://docs.gethealthie.com/schema/mutation.doc) from Healthie super helpful. 