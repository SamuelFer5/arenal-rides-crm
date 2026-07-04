// src/services/reportService.js
const bookingModel = require('../models/bookingModel');
const financeModel = require('../models/financeModel');
const { bookingService } = require('./bookingService');

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const reportService = {
  /**
   * Totales mensuales (rack/net/profit/pax) para los 12 meses, usados en
   * el dashboard (gráfico de tendencia) y en la vista de Ventas.
   * pax se calcula en JS porque viene de un campo de texto libre en bookings.
   */
  async monthly() {
    const rows = await bookingModel.monthlyTotals();
    const byMonthNum = new Map(rows.map((r) => [Number(r.month_num), r]));

    const all = await bookingModel.findAll();
    const paxByMonth = new Map();
    for (const b of all) {
      if ((b.status || '').toLowerCase().includes('cancel')) continue;
      const monthNum = Number(b.date.toISOString ? b.date.toISOString().slice(5, 7) : String(b.date).slice(5, 7));
      paxByMonth.set(monthNum, (paxByMonth.get(monthNum) || 0) + bookingService.parsePax(b.pax));
    }

    return MONTHS.map((name, idx) => {
      const monthNum = idx + 1;
      const row = byMonthNum.get(monthNum);
      return {
        month: name,
        pax: paxByMonth.get(monthNum) || 0,
        rack: row ? Number(row.rack) : 0,
        net: row ? Number(row.net) : 0,
        profit: row ? Number(row.profit) : 0,
      };
    });
  },

  async drivers() {
    const rows = await bookingModel.driverTotals();
    const all = await bookingModel.findAll();
    const paxByDriver = new Map();
    for (const b of all) {
      if ((b.status || '').toLowerCase().includes('cancel')) continue;
      if (!b.driver) continue;
      paxByDriver.set(b.driver, (paxByDriver.get(b.driver) || 0) + bookingService.parsePax(b.pax));
    }
    return rows.map((r) => ({
      driver: r.driver,
      count: Number(r.count),
      pax: paxByDriver.get(r.driver) || 0,
      rack: Number(r.rack),
      net: Number(r.net),
    }));
  },

  async finance() {
    const [expenses, providerPayouts, expenseTotal, payoutTotal] = await Promise.all([
      financeModel.listExpenses(),
      financeModel.listProviderPayouts(),
      financeModel.expenseTotal(),
      financeModel.payoutTotal(),
    ]);
    return { expenses, providerPayouts, expenseTotal, payoutTotal };
  },

  async statusCounts(month) {
    const monthNum = MONTHS.indexOf(month) + 1;
    if (!monthNum) return [];
    return bookingModel.statusCountsForMonth(monthNum);
  },

  async driverOptionsForMonth(month) {
    const monthNum = MONTHS.indexOf(month) + 1;
    if (!monthNum) return [];
    return bookingModel.distinctDriversForMonth(monthNum);
  },
};

module.exports = { reportService, MONTHS };
