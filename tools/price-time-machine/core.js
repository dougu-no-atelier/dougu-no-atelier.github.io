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
  // 厚生労働省「地域別最低賃金の全国加重平均（年度値・時給）」
  const MIN_WAGES = {1986:451,1987:461,1988:474,1989:492,1990:516,1991:542,1992:565,1993:583,1994:597,1995:611,1996:623,1997:637,1998:649,1999:654,2000:659,2001:663,2002:663,2003:664,2004:665,2005:668,2006:673,2007:687,2008:703,2009:713,2010:730,2011:737,2012:749,2013:764,2014:780,2015:798,2016:823,2017:848,2018:874,2019:901,2020:902,2021:930,2022:961,2023:1004,2024:1055,2025:1121,2026:1177};
  function wageFor(year) {
    if (!Number.isInteger(year) || year < 1986) return null;
    return year > 2026 ? MIN_WAGES[2026] : MIN_WAGES[year];
  }
  function laborHours(price, year) {
    const wage = wageFor(year);
    return wage === null ? null : price / wage;
  }
  function topIncreases(items, n) {
    const picked = [];
    items.forEach((item, index) => {
      let best = null;
      for (const record of item.records || []) {
        const result = comparison(item, record.from, 0);
        if (!result || !(result.result.percent > 0)) continue;
        if (!best || result.result.percent > best.result.result.percent ||
          (result.result.percent === best.result.result.percent && Math.abs(result.result.difference) > Math.abs(best.result.result.difference))) best = { record, result };
      }
      if (best) picked.push({ item, record: best.record, result: best.result, index });
    });
    picked.sort((a, b) => (b.result.result.percent - a.result.result.percent) || (Math.abs(b.result.result.difference) - Math.abs(a.result.result.difference)) || (a.index - b.index));
    // result は comparison の戻り値に、percent / difference / before / after（税抜価格）を手前に出したもの。
    return picked.slice(0, n).map(({ item, record, result }) => ({ item, record, result: { ...result, ...result.result, before: result.beforePrice, after: result.afterPrice } }));
  }
  const api = { compare, atYear, taxExclusive, historicalRecord, comparison, wageFor, laborHours, topIncreases };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PriceCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
