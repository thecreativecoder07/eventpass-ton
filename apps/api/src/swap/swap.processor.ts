import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Swap } from './swap.entity';
import { OmnistonService } from './omniston.service';

@Processor('swap')
export class SwapProcessor extends WorkerHost {
  private readonly logger = new Logger(SwapProcessor.name);

  constructor(
    @InjectRepository(Swap) private swapRepo: Repository<Swap>,
    private omnistonService: OmnistonService,
  ) {
    super();
  }

  async process(job: Job<{ swapId: string; swapDbId: string }>): Promise<void> {
    const { swapId, swapDbId } = job.data;

    this.logger.log(`Monitoring swap ${swapId} (attempt ${job.attemptsMade})`);

    try {
      const status = await this.omnistonService.getSwapStatus(swapId);

      if (status === 'completed') {
        // Update swap record
        await this.swapRepo.update(swapDbId, {
          status: 'completed',
          completedAt: new Date(),
        });

        this.logger.log(`Swap ${swapId} completed`);
        return; // Job done
      }

      if (status === 'failed' || status === 'expired') {
        await this.swapRepo.update(swapDbId, { status });
        this.logger.warn(`Swap ${swapId} ${status}`);
        return;
      }

      // Still pending — throw to retry
      throw new Error(`Swap ${swapId} still pending`);
    } catch (error) {
      this.logger.error(`Error monitoring swap ${swapId}: ${error.message}`);
      throw error; // BullMQ will retry
    }
  }
}
