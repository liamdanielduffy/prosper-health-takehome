import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getProviders, getRandomClient } from "../utils";

export const loader = async () => {
  const client = await getRandomClient()
  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }
  const providers = await getProviders(client)
  return json({ providers });
};

export default function Index() {
  const data = useLoaderData<typeof loader>()
  return (
    <code>
      {JSON.stringify(data)}
    </code>
  );
}
