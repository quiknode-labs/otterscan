import { useMemo } from "react";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";
import useSWR, { Fetcher } from "swr";
import useSWRImmutable from "swr/immutable";
import { ChecksummedAddress, ProcessedTransaction } from "../types";
import { providerFetcher } from "../useErigonHooks";
import { rawToProcessed } from "../search/search";
import { pageToReverseIdx } from "./pagination";
import erc20 from "../erc20.json";

/**
 * All supported transaction search types.
 *
 * Those are NOT arbitrary strings, they are used to compose RPC method
 * names.
 */
export type TransactionSearchType = "ERC20" | "ERC721";

export type TransactionMatch = {
  hash: string;
};

export const useGenericTransactionCount = (
  provider: JsonRpcProvider | undefined,
  t: TransactionSearchType,
  address: ChecksummedAddress
): number | undefined => {
  const rpcMethod = `ots_get${t}TransferCount`;
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWRImmutable([rpcMethod, address], fetcher);
  if (error) {
    return undefined;
  }
  return data as number | undefined;
};

export const useGenericTransactionList = (
  provider: JsonRpcProvider | undefined,
  t: TransactionSearchType,
  address: ChecksummedAddress,
  pageNumber: number,
  pageSize: number,
  total: number | undefined
): TransactionMatch[] | undefined => {
  const page = pageToReverseIdx(pageNumber, pageSize, total);
  const rpcMethod = `ots_get${t}TransferList`;
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWRImmutable(
    page === undefined ? null : [rpcMethod, address, page.idx, page.count],
    fetcher
  );
  if (error) {
    return undefined;
  }

  if (data === undefined) {
    return undefined;
  }
  // TODO: fix memo
  const converted = (data.results as any[]).map((m) => {
    const t: TransactionMatch = {
      hash: m.hash,
    };
    return t;
  });
  return converted.reverse();
};

// TODO: remove temporary prototype
export const useTransactionsWithReceipts = (
  provider: JsonRpcProvider | undefined,
  hash: string[] | undefined
): ProcessedTransaction[] | undefined => {
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWRImmutable(
    hash === undefined ? null : ["ots_getTransactionsWithReceipts", hash],
    fetcher
  );
  if (error) {
    return undefined;
  }

  if (!provider || data === undefined) {
    return undefined;
  }
  const converted = rawToProcessed(provider, data);
  return converted.txs;
};

export const useERC1167Impl = (
  provider: JsonRpcProvider | undefined,
  address: ChecksummedAddress | undefined
): ChecksummedAddress | undefined | null => {
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWRImmutable(
    ["ots_getERC1167Impl", address],
    fetcher
  );
  if (error) {
    return undefined;
  }
  return data;
};

export const useERC20Holdings = (
  provider: JsonRpcProvider | undefined,
  address: ChecksummedAddress
): ChecksummedAddress[] | undefined => {
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWR(["ots_getERC20Holdings", address], fetcher);
  const converted = useMemo(() => {
    if (error) {
      return undefined;
    }

    if (data === undefined || data === null) {
      return undefined;
    }
    return (data as any[]).map((m) => m.address);
  }, [data, error]);

  return converted;
};

const ERC20_PROTOTYPE = new Contract(AddressZero, erc20);

const erc20BalanceFetcher =
  (
    provider: JsonRpcProvider | undefined
  ): Fetcher<
    BigNumber | null,
    ["erc20balance", ChecksummedAddress, ChecksummedAddress]
  > =>
  async ([_, address, tokenAddress]) => {
    if (provider === undefined) {
      return null;
    }

    const contract = ERC20_PROTOTYPE.connect(provider).attach(tokenAddress);
    return contract.balanceOf(address);
  };

export const useTokenBalance = (
  provider: JsonRpcProvider | undefined,
  address: ChecksummedAddress | undefined,
  tokenAddress: ChecksummedAddress | undefined
): BigNumber | null | undefined => {
  const fetcher = erc20BalanceFetcher(provider);
  const { data, error } = useSWR(
    ["erc20balance", address, tokenAddress],
    fetcher
  );
  if (error) {
    return undefined;
  }

  if (data === undefined || data === null) {
    return undefined;
  }
  return data;
};

export type AddressAttributes = {
  erc20?: boolean;
  erc165?: boolean;
  erc721?: boolean;
  erc1155?: boolean;
  erc1167?: boolean;
  erc1167Logic?: boolean;
};

export const useAddressAttributes = (
  provider: JsonRpcProvider | undefined,
  address: ChecksummedAddress
): AddressAttributes | undefined => {
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWR(
    ["ots_getAddressAttributes", address],
    fetcher
  );
  if (error) {
    return undefined;
  }

  if (data === undefined || data === null) {
    return undefined;
  }
  return data;
};
