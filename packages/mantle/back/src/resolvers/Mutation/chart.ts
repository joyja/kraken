import { prisma } from '../../prisma';
import {
	CreateChartPageEntry,
	UpdateChartPageEntry,
	DeleteChartPageEntry,
	CreateChartEntry,
	UpdateChartEntry,
	DeleteChartEntry,
	CreatePenEntry,
	UpdatePenEntry,
	DeletePenEntry,
	Pen as ResolverPen
} from '../../resolvers/types';
import { ChartPage, Chart } from '@prisma/client';
// import { Log } from '../../log';

// const log = new Log('Charts');

export async function createChartPage(
	_root: unknown,
	{ input }: { input: CreateChartPageEntry }
): Promise<ChartPage> {
	return prisma.chartPage.create({
		data: {
			name: input.name,
			description: input.description
		},
		include: { charts: { include: { pens: true } } }
	});
}

export async function updateChartPage(
	_root: unknown,
	{ input }: { input: UpdateChartPageEntry }
): Promise<ChartPage> {
	const { id, ...updateFields }: { id: string; [key: string]: any } = input;
	const data: { [key: string]: any } = {};
	// Filter out null values
	Object.keys(updateFields).forEach((key: string) => {
		if (updateFields[key] !== null && updateFields[key] !== undefined)
			data[key] = updateFields[key];
	});
	return prisma.chartPage.update({
		where: { id },
		data,
		include: { charts: { include: { pens: true } } }
	});
}

export async function deleteChartPage(
	_root: unknown,
	{ input: { id } }: { input: DeleteChartPageEntry }
): Promise<ChartPage> {
	return prisma.chartPage.delete({
		where: { id },
		include: { charts: { include: { pens: true } } }
	});
}

export async function createChart(
	_root: unknown,
	{ input }: { input: CreateChartEntry }
): Promise<Chart> {
	const { pens, ...scalarInputs } = input;
	return prisma.chart.create({
		data: {
			...scalarInputs,
			pens: { create: pens?.map((pen: CreatePenEntry) => ({ ...pen })) }
		},
		include: { pens: true }
	});
}

export async function updateChart(
	_root: unknown,
	{ input }: { input: UpdateChartEntry }
): Promise<Chart> {
	const { id, pens, ...updateFields }: { id: string; [key: string]: any } = input;
	const data: { [key: string]: any } = {};
	// Filter out null values
	Object.keys(updateFields).forEach((key: string) => {
		if (updateFields[key] !== null && updateFields[key] !== undefined)
			data[key] = updateFields[key];
	});
	if (pens) {
		await prisma.pen.deleteMany({ where: { chartId: id } });
		await prisma.pen.createMany({
			data: pens.map((pen: CreatePenEntry) => ({ ...pen, chartId: id }))
		});
	}
	return prisma.chart.update({ where: { id }, data, include: { pens: true } });
}

export async function deleteChart(
	_root: unknown,
	{ input: { id } }: { input: DeleteChartEntry }
): Promise<Chart> {
	return prisma.chart.delete({ where: { id }, include: { pens: true } });
}

export async function createPen(
	_root: unknown,
	{ input }: { input: CreatePenEntry }
): Promise<ResolverPen> {
	return prisma.pen.create({ data: input });
}

export async function updatePen(
	_root: unknown,
	{ input }: { input: UpdatePenEntry }
): Promise<ResolverPen> {
	const { id, ...updateFields }: { id: string; [key: string]: any } = input;
	const data: { [key: string]: any } = {};
	// Filter out null values
	Object.keys(updateFields).forEach((key: string) => {
		if (updateFields[key] !== null && updateFields[key] !== undefined)
			data[key] = updateFields[key];
	});
	return prisma.pen.update({ where: { id }, data });
}

export async function deletePen(
	_root: unknown,
	{ input: { id } }: { input: DeletePenEntry }
): Promise<ResolverPen> {
	return prisma.pen.delete({ where: { id } });
}
