import { Module } from '@nestjs/common'

import { BalanceGrpcModule } from '@/infrastructure/grpc/balance/balance.module'

import { BonusesController } from './bonuses.controller'
import { BonusesService } from './bonuses.service'

@Module({
	controllers: [BonusesController],
	providers: [BonusesService],
	imports: [BalanceGrpcModule]
})
export class BonusesModule {}
