import { useEffect, useState } from "react";
import {
  JsonRpcProvider,
  JsonRpcBatchProvider,
  StaticJsonRpcProvider,
  WebSocketProvider,
} from "@ethersproject/providers";
import { ConnectionStatus } from "./types";
import { MIN_API_LEVEL } from "./params";

export const DEFAULT_ERIGON_URL = "http://127.0.0.1:8545";

export const useProvider = (
  erigonURL?: string,
  experimentalFixedChainId?: number
): [ConnectionStatus, JsonRpcProvider | undefined] => {
  const [connStatus, setConnStatus] = useState<ConnectionStatus>(
    ConnectionStatus.CONNECTING
  );

  if (erigonURL !== undefined) {
    if (erigonURL === "") {
      console.info(`Using default erigon URL: ${DEFAULT_ERIGON_URL}`);
      erigonURL = DEFAULT_ERIGON_URL;
    } else {
      console.log(`Using configured erigon URL: ${erigonURL}`);
    }
  }

  const [provider, setProvider] = useState<JsonRpcProvider | undefined>();
  useEffect(() => {
    // Skip probing?
    if (experimentalFixedChainId !== undefined) {
      console.log("Skipping node probe");
      setConnStatus(ConnectionStatus.CONNECTED);
      setProvider(
        new StaticJsonRpcProvider(erigonURL, experimentalFixedChainId)
      );
      return;
    }

    if (erigonURL === undefined) {
      setConnStatus(ConnectionStatus.NOT_ETH_NODE);
      setProvider(undefined);
      return;
    }

    setConnStatus(ConnectionStatus.CONNECTING);

    const tryToConnect = async () => {
      let provider: JsonRpcProvider;
      if (erigonURL?.startsWith("ws://") || erigonURL?.startsWith("wss://")) {
        provider = new WebSocketProvider(erigonURL);
      } else {
        provider = new JsonRpcBatchProvider(erigonURL);
      }

      // Check if it has Otterscan patches by probing a lightweight method
      try {
        const level = await provider.send("ots_getApiLevel", []);
        if (level < MIN_API_LEVEL) {
          setConnStatus(ConnectionStatus.NOT_OTTERSCAN_PATCHED);
          setProvider(undefined);
        } else {
          setConnStatus(ConnectionStatus.CONNECTED);
          setProvider(provider);
        }
      } catch (err) {
        console.log(err);
        setConnStatus(ConnectionStatus.NOT_OTTERSCAN_PATCHED);
        setProvider(undefined);
      }
    };
    tryToConnect();
  }, [erigonURL, experimentalFixedChainId]);

  return [connStatus, provider];
};
