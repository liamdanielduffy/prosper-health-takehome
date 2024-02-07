import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getClientSummary, getProviders, getRandomClient, getSpecificClient } from "../utils";
import { ClientSummary, Client, ProviderWithCost } from "../types";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const userNumParam = url.searchParams.get("userNum");
  const userNum = userNumParam ? parseInt(userNumParam) : null
  let client
  if (userNum) {
    client = await getSpecificClient(userNum) ?? await getRandomClient()
  } else {
    client = await getRandomClient()
  }
  if (!client) {
    throw new Response("Not Found", { status: 404 });
  }
  const providers = await getProviders(client)
  const clientSummary = getClientSummary(client)
  return json({ client, providers, clientSummary });
};

function Warning(props: { message: string }) {
  return (
    <div role="alert" className="alert alert-warning">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <span>{props.message}</span>
    </div>
  )
}

function Alert(props: ClientSummary) {

  if (props.wantsTherapy && !props.canReceiveTherapy) {
    return (
      <Warning message="Unfortunately, we are unable to offer therapy in your state." />
    )
  }
  if (props.wantsAssessment && !props.canReceiveAssessment) {
    return (
      <Warning message="Unfortunately, we are unable to offer an assessment in your state." />
    )
  }

  if (!props.canUseInsurance) {
    if (!props.locatedInSupportedState) {
      return (
        <Warning message="Unfortunately, we cannot accept insurance in your state of residence." />
      )
    }

    if (!props.hasAcceptedInsurance) {
      return (
        <Warning message={"Unfortunately, we do not accept your insurance."} />
      )
    }
  }

  return <></>
}

function ClientInfo(props: Client) {
  return (
    <div className="border border-gray-300 rounded-md m-8 p-8 inline-block mx-auto text-center">
      <h2 className="text-3xl font-bold mb-2">{`${props.first_name} ${props.last_name}`}</h2>
      <p className="text-lg text-gray-600 mb-1">{props.email}</p>
      <div className="w-full bg-gray-200 h-px my-4" />
      <p className="text-left text-md font-medium mb-1">Seeking <span className="text-indigo-600">{props.desired_service}</span></p>
      <p className="text-left text-md font-medium mb-1">Lives in <span className="text-indigo-600">{props.state}</span></p>
      <p className="text-left text-md font-medium">Insured by <span className="text-indigo-600">{props.insurance}</span></p>
    </div>
  )
}

function ProviderInfo(props: ProviderWithCost) {
  return (
    <div className="max-w-md shadow-xl border border-gray-200 rounded-lg m-4 p-8 inline-block bg-white hover:bg-gray-50 transition-colors">
      <h2 className="text-4xl font-extrabold mb-2 text-gray-800">{`${props.first_name} ${props.last_name}`}</h2>
      <p className="text-md text-gray-600 mb-1">{props.email}</p>
      <p className="text-2xl font-semibold text-green-600 mb-1"><span className="text-green-600">${props.costInDollars}</span></p>
      <p className="text-md text-gray-600 mb-1">{props.gender}</p>
      <div className="w-full bg-gray-200 h-px my-4" />
      <p className="text-md text-gray-500">{props.biography}</p>
    </div>
  )
}

export default function Index() {
  const { clientSummary, client, providers } = useLoaderData<typeof loader>()
  return (
    <div className="w-full h-full flex flex-col items-center">
      <Alert {...clientSummary} />
      <ClientInfo {...client} />
      <h1 className="m-8 text-5xl font-extrabold text-center">Available Providers</h1>
      <div className="w-full flex flex-wrap max-w-5xl">
        {providers.map(p => <ProviderInfo key={p.email} {...p} />)}
      </div>
    </div>
  );
}
