import { TransactionType } from '@ciganov/contracts/dist/gen/balance'
import type {
	ActivatePromoCodeRequest,
	ActivatePromoCodeResponse,
	CreatePromoCodeRequest,
	CreatePromoCodeResponse,
	GetPromoCodesResponse
} from '@ciganov/contracts/dist/gen/bonus'
import { PromoType as ProtoPromoType } from '@ciganov/contracts/dist/gen/bonus'
import { convertEnum, dateToProto, protoToDate, RpcStatus } from '@ciganov/core'
import { Injectable } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { PromoType } from '@prisma/generated/enums'
import { createHash } from 'crypto'
import { PinoLogger } from 'nestjs-pino'
import { lastValueFrom } from 'rxjs'

import { BalanceClientGrpc } from '@/infrastructure/grpc/balance/balance.grpc'
import { PrismaService } from '@/infrastructure/prisma/prisma.service'

@Injectable()
export class BonusesService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly balanceGrpcClient: BalanceClientGrpc,
		private readonly logger: PinoLogger
	) {
		this.logger.setContext(BonusesService.name)
	}

	async activatePromoCode(
		data: ActivatePromoCodeRequest
	): Promise<ActivatePromoCodeResponse> {
		const { code, userId } = data
		const hash = createHash('sha256').update(code).digest('hex')
		const promoCode = await this.prismaService.promoCode.findUnique({
			where: {
				code: hash
			},
			include: {
				activations: true
			}
		})

		if (!promoCode)
			throw new RpcException({
				code: RpcStatus.NOT_FOUND,
				details: 'Promo code not found'
			})

		if (promoCode.activationCount < promoCode.activations.length)
			throw new RpcException({
				code: RpcStatus.RESOURCE_EXHAUSTED,
				details: 'Promo code activation limit reached'
			})

		const { ok } = await lastValueFrom(
			this.balanceGrpcClient.transaction({
				amount: promoCode.amount,
				type: TransactionType.ADD_BONUS,
				userId: userId
			})
		)

		if (ok) {
			await this.prismaService.promoActivation.create({
				data: {
					userId,
					promoCode: { connect: { id: promoCode.id } }
				}
			})
		}

		return {
			ok: true
		}
	}

	async createPromoCode(
		data: CreatePromoCodeRequest
	): Promise<CreatePromoCodeResponse> {
		const { activationCount, amount, code, expiresAt, type, description } = data
		const hash = createHash('sha256').update(code).digest('hex')
		await this.prismaService.promoCode.create({
			data: {
				amount: amount,
				code: hash,
				expiresAt: protoToDate(expiresAt),
				type: convertEnum(PromoType, type),
				activationCount: activationCount,
				description
			}
		})
		return {
			ok: true
		}
	}

	async getPromoCodes(): Promise<GetPromoCodesResponse> {
		const promoCodes = await this.prismaService.promoCode.findMany()
		return {
			promocodes: promoCodes.map(promo => ({
				id: promo.id,
				code: promo.code,
				amount: promo.amount,
				type: convertEnum(ProtoPromoType, promo.type),
				description: promo.description,
				activationCount: promo.activationCount,
				expiresAt: dateToProto(promo.expiresAt),
				isActive: promo.expiresAt > new Date()
			}))
		}
	}
}
