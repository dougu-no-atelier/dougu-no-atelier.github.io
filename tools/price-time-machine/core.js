(function (root) {
  'use strict';
  function compare(before, after, budget) {
    if (![before, after, budget].every(Number.isFinite) || before <= 0 || after <= 0 || budget < 0 || Math.max(before, after, budget) > 100000000) throw new Error('価格は正の数、予算はゼロ以上で入力してください。上限は一億円です。');
    const rawDifference=after-before,tolerance=Number.EPSILON*16*Math.max(1,before,after);
    const difference=Math.abs(rawDifference)<=tolerance?0:rawDifference,ratio=difference===0?1:after/before;
    return { difference, ratio, percent: (ratio - 1) * 100, beforeCount: Math.floor((budget + 1e-8) / before), afterCount: Math.floor((budget + 1e-8) / after) };
  }
  function atYear(item, year) {
    // Never interpolate prices, and never extrapolate past the checked snapshot.
    if (!Number.isInteger(year) || year > 2026 || year < item.history[0].year) return null;
    return item.history.filter(point => point.year <= year).at(-1) || null;
  }
  function taxExclusive(record) {
    if (!record || !Number.isFinite(record.price) || record.price <= 0) return null;
    if (record.taxMode === 'exclusive') return record.price;
    if (record.taxMode === 'inclusive' && Number.isFinite(record.taxRate) && record.taxRate >= 0 && record.taxRate <= 1) return record.price / (1 + record.taxRate);
    return null;
  }
  function historicalRecord(records, year) {
    if (!Number.isInteger(year)) return null;
    return records.find(record => record.from <= year && record.to >= year) || null;
  }
  function comparison(item, year, budget) {
    const before = historicalRecord(item.records, year), after = item.current;
    const b = taxExclusive(before), a = taxExclusive(after);
    if (b === null || a === null) return null;
    let unitComparison = null;
    const bq = before.quantity, aq = after.quantity;
    if (bq && aq && bq.unit === aq.unit && ['g','ml'].includes(bq.unit) && [bq.value,aq.value].every(v=>Number.isFinite(v)&&v>0)) {
      const beforeUnitPrice=b/bq.value*100, afterUnitPrice=a/aq.value*100;
      unitComparison={unit:bq.unit,beforePrice:beforeUnitPrice,afterPrice:afterUnitPrice,result:compare(beforeUnitPrice,afterUnitPrice,0)};
    }
    return { before, after, beforePrice:b, afterPrice:a, result:compare(b,a,budget), unitComparison };
  }
  const api = { compare, atYear, taxExclusive, historicalRecord, comparison };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PriceCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
