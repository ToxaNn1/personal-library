import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "@library/contracts";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const link = new RPCLink({
    url: `${config.public.apiBaseUrl}/rpc`,
  });

  const client: ContractRouterClient<typeof contract> = createORPCClient(link);

  return {
    provide: {
      orpc: client,
    },
  };
});
