import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { Swap } from './swap.entity';
import { OmnistonService } from './omniston.service';
import { StonfiService } from './stonfi.service';

export interface QuoteParams {
  eventId: string;
  tier: number;
  fromChain: string;
  fromToken: string;
}

export interface SwapResult {
  swapId: string;
  depositAddress: string;
  amount: string;
  chain: string;
  token: string;
  expiresAt: Date;
  estimatedWait: string;
}

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    @InjectRepository(Swap) private swapRepo: Repository<Swap>,
    @InjectQueue('swap') private swapQueue: Queue,
    private omnistonService: OmnistonService,
    private stonfiService: StonfiService,
  ) {}

  /**
   * Get a price quote for cross-chain ticket purchase
   */
  async getQuote(params: QuoteParams) {
    const { eventId, tier, fromChain, fromToken } = params;

    // Get event to determine ticket price
    // const event = await this.eventService.findOne(eventId);
    // const ticketPrice = this.calculatePrice(event.basePrice, tier);

    if (fromChain === 'ton') {
      // Same-chain swap via STON.fi
      return this.stonfiService.getSameChainQuote({
        offerToken: fromToken,
        askToken: 'TON',
        amount: '1000000000', // placeholder
      });
    }

    // Cross-chain quote via Omniston
    return this.omnistonService.getQuote({
      fromChain,
      fromToken,
      toChain: 'ton',
      toToken: 'TON',
      amount: '1000000000', // placeholder
      slippage: 0.01,
    });
  }

  /**
   * Initiate a cross-chain swap
   */
  async initiateCrossChainSwap(params: {
    userId: string;
    eventId: string;
    tier: number;
    fromChain: string;
    fromToken: string;
    fromAmount: string;
    tonRecipient: string;
  }): Promise<SwapResult> {
    // 1. Create swap via Omniston
    const swap = await this.omnistonService.initiateSwap({
      fromChain: params.fromChain,
      fromToken: params.fromToken,
      toChain: 'ton',
      toToken: 'TON',
      amount: params.fromAmount,
      recipient: params.tonRecipient,
      slippageTolerance: 0.01,
    });

    // 2. Store pending swap in database
    const swapRecord = this.swapRepo.create({
      userId: params.userId,
      eventId: params.eventId,
      swapId: swap.swapId,
      fromChain: params.fromChain,
      fromToken: params.fromToken,
      fromAmount: params.fromAmount,
      status: 'pending',
      depositAddress: swap.depositAddress,
      expiresAt: new Date(swap.expiresAt),
    });
    await this.swapRepo.save(swapRecord);

    // 3. Add to monitoring queue
    await this.swapQueue.add('monitor-swap', {
      swapId: swap.swapId,
      swapDbId: swapRecord.id,
    }, {
      attempts: 10,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return {
      swapId: swap.swapId,
      depositAddress: swap.depositAddress,
      amount: params.fromAmount,
      chain: params.fromChain,
      token: params.fromToken,
      expiresAt: new Date(swap.expiresAt),
      estimatedWait: '30-120 seconds',
    };
  }

  /**
   * Handle swap completion — called by processor when swap succeeds
   */
  async handleSwapCompletion(swapId: string, txHash: string, amountReceived: string) {
    const swap = await this.swapRepo.findOne({ where: { swapId } });
    if (!swap) throw new Error(`Swap ${swapId} not found`);

    swap.status = 'completed';
    swap.txHash = txHash;
    swap.toAmount = amountReceived;
    swap.completedAt = new Date();
    await this.swapRepo.save(swap);

    // Emit event for SBT minter to pick up
    // this.eventEmitter.emit('swap.completed', { swap, amountReceived });

    this.logger.log(`Swap ${swapId} completed — ${amountReceived} TON received`);
    return swap;
  }

  private calculatePrice(basePrice: bigint, tier: number): bigint {
    const multipliers = [1n, 2n, 5n]; // General, VIP, Premium
    return basePrice * multipliers[tier];
  }
}
