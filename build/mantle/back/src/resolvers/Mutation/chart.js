"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePen = exports.updatePen = exports.createPen = exports.deleteChart = exports.updateChart = exports.createChart = exports.deleteChartPage = exports.updateChartPage = exports.createChartPage = void 0;
const prisma_1 = require("../../prisma");
// import { Log } from '../../log';
// const log = new Log('Charts');
async function createChartPage(_root, { input }) {
    return prisma_1.prisma.chartPage.create({
        data: {
            name: input.name,
            description: input.description
        },
        include: { charts: { include: { pens: true } } }
    });
}
exports.createChartPage = createChartPage;
async function updateChartPage(_root, { input }) {
    const { id, ...updateFields } = input;
    const data = {};
    // Filter out null values
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key] !== null && updateFields[key] !== undefined)
            data[key] = updateFields[key];
    });
    return prisma_1.prisma.chartPage.update({
        where: { id },
        data,
        include: { charts: { include: { pens: true } } }
    });
}
exports.updateChartPage = updateChartPage;
async function deleteChartPage(_root, { input: { id } }) {
    return prisma_1.prisma.chartPage.delete({
        where: { id },
        include: { charts: { include: { pens: true } } }
    });
}
exports.deleteChartPage = deleteChartPage;
async function createChart(_root, { input }) {
    const { pens, ...scalarInputs } = input;
    return prisma_1.prisma.chart.create({
        data: {
            ...scalarInputs,
            pens: { create: pens?.map((pen) => ({ ...pen })) }
        },
        include: { pens: true }
    });
}
exports.createChart = createChart;
async function updateChart(_root, { input }) {
    const { id, pens, ...updateFields } = input;
    const data = {};
    // Filter out null values
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key] !== null && updateFields[key] !== undefined)
            data[key] = updateFields[key];
    });
    if (pens) {
        await prisma_1.prisma.pen.deleteMany({ where: { chartId: id } });
        await prisma_1.prisma.pen.createMany({
            data: pens.map((pen) => ({ ...pen, chartId: id }))
        });
    }
    return prisma_1.prisma.chart.update({ where: { id }, data, include: { pens: true } });
}
exports.updateChart = updateChart;
async function deleteChart(_root, { input: { id } }) {
    return prisma_1.prisma.chart.delete({ where: { id }, include: { pens: true } });
}
exports.deleteChart = deleteChart;
async function createPen(_root, { input }) {
    return prisma_1.prisma.pen.create({ data: input });
}
exports.createPen = createPen;
async function updatePen(_root, { input }) {
    const { id, ...updateFields } = input;
    const data = {};
    // Filter out null values
    Object.keys(updateFields).forEach((key) => {
        if (updateFields[key] !== null && updateFields[key] !== undefined)
            data[key] = updateFields[key];
    });
    return prisma_1.prisma.pen.update({ where: { id }, data });
}
exports.updatePen = updatePen;
async function deletePen(_root, { input: { id } }) {
    return prisma_1.prisma.pen.delete({ where: { id } });
}
exports.deletePen = deletePen;
