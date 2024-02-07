- I opted to use a [Remix](https://remix.run) boilerplate to bootstrap the app instead of the Vite React template, to demonstrate how I would build this page in a production app. I wanted to be sure that sensitive data & API keys were handled entirely serverside, and that only the minimum necessary data was passed back to the client when loading the page. 

- The index route of my app is defined in `app/routes/_index.tsx`. The [loader](https://remix.run/docs/en/main/discussion/data-flow#route-loader) function runs serverside to fetch providers from the Healthie API, and prospective clients from a CSV string. 

- There are some quirks of how I load data that I wanted to document here:

1. I re-read the providers CSV file, even though the data is already imported into Healthie. I did this in order to distinguish between test users and users I imported from the CSV. I tried to delete test users with `deleteOrganizationMembership`, but got an error message when running the mutation saying `"Organization Memberships cannot be destroyed"`. I wasn't sure whether this was true for all API calls, or just my token.  

2. I load a CSV-formatted string, rather than reading the file directly, since Vercel's serverless functions don't support storing files alongside source code. I'd need to use a Blob storage service, and to avoid this, I copied the CSV data into strings. These are exported from files inside the `data/` folder.



