import { useMutation } from '@tanstack/react-query';
import { useTonConnect } from './useTonConnect';
import { api } from '../services/api';

export interface SwapParams {
  eventId: string;
  tier: number;
  fromChain: string;
  fromToken: string;
  fromAmount?: string;
}

export interface SwapResult {
  swapId: string;
  depositAddress: string;
  amount: string;
  chain: string;
  token: string;
  expiresAt: string;
  estimatedWait: string;
}

export function useCrossChainSwap() {
  const { address: tonAddress } = useTonConnect();

  const quoteMutation = useMutation({
    mutationFn: async (params: SwapParams) => {
      const { data } = await api.post('/swap/quote', params);
      return data;
    },
  });

  const swapMutation = useMutation({
    mutationFn: async (params: SwapParams & { quoteId?: string }) => {
      if (!tonAddress) throw new Error('Wallet not connected');

      const { data } = await api.post('/swap/initiate', {
        ...params,
        tonRecipient: tonAddress,
      });
      return data as SwapResult;
    },
    onSuccess: (data) => {
      // Start polling swap status
      pollSwapStatus(data.swapId);
    },
  });

  return {
    getQuote: quoteMutation.mutateAsync,
    quoteData: quoteMutation.data,
    quoteLoading: quoteMutation.isPending,
    initiateSwap: swapMutation.mutateAsync,
    swapData: swapMutation.data,
    swapLoading: swapMutation.isPending,
  };
}

function pollSwapStatus(swapId: string) {
  const interval = setInterval(async () => {
    try {
      const { data } = await api.get(`/swap/status/${swapId}`);
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'expired') {
        clearInterval(interval);
      }
    } catch {
      // Continue polling on error
    }
  }, 5000);

  // Stop after 10 minutes
  setTimeout(() => clearInterval(interval), 600_000);
}
