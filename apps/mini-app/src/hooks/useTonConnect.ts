import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();

  const connect = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnect = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const sendTransaction = async (params: {
    to: string;
    amount: string;
    payload?: string;
  }) => {
    return tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: params.to,
          amount: params.amount,
          payload: params.payload,
        },
      ],
    });
  };

  return {
    address,
    connected: !!address,
    connect,
    disconnect,
    sendTransaction,
  };
}
