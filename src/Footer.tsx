import React, { useContext } from "react";
import { RuntimeContext } from "./useRuntime";
import { useConfig } from "./useConfig";

const Footer: React.FC = () => {
  const { provider } = useContext(RuntimeContext);
  const config = useConfig();

  return config?.customFooterMessage ? (
      <div className={`w-full border-t border-t-gray-100 px-2 py-1 text-xs bg-link-blue text-gray-200 text-center`}>
        {config.customFooterMessage}
      </div>
      ) : (
    <div
      className={`w-full border-t border-t-gray-100 px-2 py-1 text-xs ${
        provider?.network.chainId === 1
          ? "bg-link-blue text-gray-200"
          : "bg-orange-400 text-white"
      } text-center`}
    >
      {provider ? (
        <>Using Erigon node at {provider.connection.url}</>
      ) : (
        <>Waiting for the provider...</>
      )}
    </div>
  );
};

export default React.memo(Footer);
