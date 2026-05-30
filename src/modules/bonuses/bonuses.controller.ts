import type {
	ActivatePromoCodeRequest,
	ActivatePromoCodeResponse,
	CreatePromoCodeRequest,
	CreatePromoCodeResponse,
	GetPromoCodesResponse
} from '@ciganov/contracts/dist/gen/bonus'
import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'

import { BonusesService } from './bonuses.service'

@Controller()
export class BonusesController {
	constructor(private readonly bonusesService: BonusesService) {}

	@GrpcMethod('BonusService', 'ActivatePromoCode')
	async activatePromoCode(
		data: ActivatePromoCodeRequest
	): Promise<ActivatePromoCodeResponse> {
		return this.bonusesService.activatePromoCode(data)
	}

	@GrpcMethod('BonusService', 'GetPromoCodes')
	async getPromoCodes(): Promise<GetPromoCodesResponse> {
		return this.bonusesService.getPromoCodes()
	}

	@GrpcMethod('BonusService', 'CreatePromoCode')
	async createPromoCode(
		data: CreatePromoCodeRequest
	): Promise<CreatePromoCodeResponse> {
		return this.bonusesService.createPromoCode(data)
	}
}
