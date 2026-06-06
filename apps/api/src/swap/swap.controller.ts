import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SwapService } from './swap.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('swap')
export class SwapController {
  constructor(private swapService: SwapService) {}

  @Get('quote')
  async getQuote(
    @Body() body: { eventId: string; tier: number; fromChain: string; fromToken: string },
  ) {
    return this.swapService.getQuote(body);
  }

  @Post('initiate')
  @UseGuards(AuthGuard)
  async initiateSwap(
    @Body() body: {
      eventId: string;
      tier: number;
      fromChain: string;
      fromToken: string;
      fromAmount: string;
      tonRecipient: string;
    },
    @Param('userId') userId: string,
  ) {
    return this.swapService.initiateCrossChainSwap({
      ...body,
      userId,
    });
  }

  @Get('status/:swapId')
  async getSwapStatus(@Param('swapId') swapId: string) {
    return { swapId, status: await this.swapService.getSwapStatus(swapId) };
  }
}
