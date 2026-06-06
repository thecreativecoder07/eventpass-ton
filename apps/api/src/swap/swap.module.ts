import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { OmnistonService } from './omniston.service';
import { StonfiService } from './stonfi.service';
import { SwapProcessor } from './swap.processor';
import { Swap } from './swap.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Swap]),
    BullModule.registerQueue({ name: 'swap' }),
  ],
  controllers: [SwapController],
  providers: [
    SwapService,
    OmnistonService,
    StonfiService,
    SwapProcessor,
  ],
  exports: [SwapService],
})
export class SwapModule {}
