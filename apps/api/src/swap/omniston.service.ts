import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OmnistonQuoteParams {
  fromChain: string;
  fromToken: string;
  toChain: string;
  toToken: string;
  amount: string;
  slippage: number;
}

export interface OmnistonSwapResult {
  swapId: string;
  depositAddress: string;
  expiresAt: number;
  fromAmount: string;
  toAmount: string;
  fee: string;
}

@Injectable()
export class OmnistonService implements OnModuleInit {
  private readonly logger = new Logger(OmnistonService.name);
  private ws: WebSocket | null = null;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    const endpoint = this.config.get('OMNISTON_WS_ENDPOINT');
    if (!endpoint) {
      this.logger.warn('Omniston WS endpoint not configured');
      return;
    }

    this.ws = new WebSocket(endpoint);
    this.ws.on('open', () => this.logger.log('Connected to Omniston'));
    this.ws.on('error', (err) => this.logger.error('Omniston WS error', err));
    this.ws.on('close', () => {
      this.logger.warn('Omniston WS closed — reconnecting in 5s');
      setTimeout(() => this.connectWebSocket(), 5000);
    });
  }

  /**
   * Get cross-chain quotes from Omniston resolvers
   */
  async getQuote(params: OmnistonQuoteParams): Promise<any> {
    // In production, this calls the Omniston SDK
    // const quotes = await this.omniston.requestQuotes(params);
    // return this.selectBestQuote(quotes);

    this.logger.log(`Getting Omniston quote: ${params.fromChain}/${params.fromToken} → ${params.toChain}/${params.toToken}`);

    // Placeholder — real implementation uses @ston-fi/omniston-sdk
    return {
      fromAmount: params.amount,
      toAmount: '9500000000', // estimated
      fee: '50000000',
      estimatedTime: 60,
      resolverUrl: 'https://resolver.ston.fi',
    };
  }

  /**
   * Initiate a cross-chain swap via Omniston
   */
  async initiateSwap(params: {
    fromChain: string;
    fromToken: string;
    toChain: string;
    toToken: string;
    amount: string;
    recipient: string;
    slippageTolerance: number;
  }): Promise<OmnistonSwapResult> {
    this.logger.log(`Initiating swap: ${params.fromChain}/${params.fromToken} → ${params.toChain}/${params.toToken}`);

    // Placeholder — real implementation uses Omniston SDK
    return {
      swapId: `swap_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      depositAddress: 'EQD...placeholder',
      expiresAt: Date.now() / 1000 + 3600,
      fromAmount: params.amount,
      toAmount: '9500000000',
      fee: '50000000',
    };
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string): Promise<string> {
    // In production, polls Omniston for swap status
    return 'pending';
  }

  private selectBestQuote(quotes: any[]): any {
    return quotes.reduce((best, q) =>
      BigInt(q.toAmount) > BigInt(best.toAmount) ? q : best
    );
  }
}
