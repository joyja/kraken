import { prisma } from '../../prisma.js'
import {
	type CreateChartPageEntry,
	type UpdateChartPageEntry,
	type DeleteChartPageEntry,
	type CreateChartEntry,
	type UpdateChartEntry,
	type DeleteChartEntry,
	type CreatePenEntry,
	type UpdatePenEntry,
	type DeletePenEntry,
	type Pen as ResolverPen
} from '../../resolvers/types.js'
import { type ChartPage, type Chart } from '@prisma/client'
// import { Log } from '../../log';

// const log = new Log('Charts');

export async function createChartPage(
	_root: unknown,
	{ input }: { input: CreateChartPageEntry }
): Promise<ChartPage> {
	return await prisma.chartPage.create({
		data: {
			name: input.name,
			description: input.description
		},
		include: { charts: { include: { pens: true } } }
	})
}

export async function updateChartPage(
	_root: unknown,
	{ input }: { input: UpdateChartPageEntry }
): Promise<ChartPage> {
	const { id, ...updateFields }: { id: string; [key: string]: any } = input
	const data: Record<string, any> = {}
	// Filter out null values
	Object.keys(updateFields).forEach((key: string) => {
		if (updateFields[key] !== null && updateFields[key] !== undefined) data[key] = updateFields[key]
	})
	return await prisma.chartPage.update({
		where: { id },
		data,
		include: { charts: { include: { pens: true } } }
	})
}

export async function deleteChartPage(
	_root: unknown,
	{ input: { id } }: { input: DeleteChartPageEntry }
): Promise<ChartPage> {
	return await prisma.chartPage.delete({
		where: { id },
		include: { charts: { include: { pens: true } } }
	})
}

export async function createChart(
	_root: unknown,
	{ input }: { input: CreateChartEntry }
): Promise<Chart> {
	const { pens, ...scalarInputs } = input
	return await prisma.chart.create({
		data: {
			...scalarInputs,
			pens: { create: pens?.map((pen: CreatePenEntry) => ({ ...pen })) }
		},
		include: { pens: true }
	})
}

export async function updateChart(
	_root: unknown,
	{ input }: { input: UpdateChartEntry }
): Promise<Chart> {
	const { id, pens, ...updateFields }: { id: string; [key: string]: any } = input
	const data: Record<string, any> = {}
	// Filter out null values
	Object.keys(updateFields).forEach((key: string) => {
		if (updateFields[key] !== null && updateFields[key] !== undefined) data[key] = updateFields[key]
	})
	if (pens !== null && pens !== undefined) {
		await prisma.pen.deleteMany({ where: { chartId: id } })
		await prisma.pen.createMany({
			data: pens.map((pen: CreatePenEntry) => ({ ...pen, chartId: id }))
		})
	}
	return await prisma.chart.update({ where: { id }, data, include: { pens: true } })
}

export async function deleteChart(
	_root: unknown,
	{ input: { id } }: { input: DeleteChartEntry }
): Promise<Chart> {
	return await prisma.chart.delete({ where: { id }, include: { pens: true } })
}

export async function createPen(
	_root: unknown,
	{ input }: { input: CreatePenEntry }
): Promise<ResolverPen> {
	return await prisma.pen.create({ data: input })
}

export async function updatePen(
	_root: unknown,
	{ input }: { input: UpdatePenEntry }
): Promise<ResolverPen> {
	const { id, ...updateFields }: { id: string; [key: string]: any } = input
	const data: Record<string, any> = {}
	// Filter out null values
	Object.keys(updateFields).forEach((key: string) => {
		if (updateFields[key] !== null && updateFields[key] !== undefined) data[key] = updateFields[key]
	})
	return await prisma.pen.update({ where: { id }, data })
}

export async function deletePen(
	_root: unknown,
	{ input: { id } }: { input: DeletePenEntry }
): Promise<ResolverPen> {
	return await prisma.pen.delete({ where: { id } })
}
