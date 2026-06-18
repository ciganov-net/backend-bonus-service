import { PrismaPg } from '@prisma/adapter-pg'
import { Decimal } from '@prisma/client/runtime/client'
import * as dotenv from 'dotenv'

import { PrismaClient, PromoCode } from './generated/client'

dotenv.config({
	path: '.env.production.local'
})

const adapter = new PrismaPg({
	user: process.env.DATABASE_USER!,
	password: process.env.DATABASE_PASSWORD!,
	host: process.env.DATABASE_HOST!,
	port: Number(process.env.DATABASE_PORT!),
	database: process.env.DATABASE_NAME!
})

const prisma = new PrismaClient({ adapter })

const PROMO: PromoCode[] = [
	{
		id: 'jRUhNsgXih2OYg4OEw4QN',
		code: 'a82cfdc3e9b89725e1c2fbe9098ac17fbbe8b0f935ccffec9826f84d79eca2d5',
		amount: 5000,
		type: 'FREE_BET',
		description: 'Фрибет 5000 рублей',
		activationCount: 999999,
		expiresAt: new Date('2049-01-01T00:00:00'),
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
]
async function seed() {
	console.log('Seeder started')

	try {
		await prisma.$transaction(async tx => {
			await tx.promoActivation.deleteMany()
			await tx.promoCode.deleteMany()
			await tx.promoCode.createMany({
				data: PROMO
			})
		})
		console.log('Seeder successfully completed')
	} catch (e) {
		console.log('Seeder failed')
		console.log(e)
		process.exit(1)
	}
}

seed()
