/**
 * Approximate emission factors (kg CO2e per unit).
 * Restaurant: separate veg vs non-veg INR (more non-veg ⇒ higher emissions).
 */
const FACTORS = {
  Electricity: 0.82,
  Petrol: 2.31,
  Diesel: 2.68,
  LPG: 1.51,
  /** kg CO2e per ₹ for vegetarian section */
  RestaurantVeg: 0.038,
  /** kg CO2e per ₹ for non-vegetarian section */
  RestaurantNonVeg: 0.115,
  /** when veg/non-veg split cannot be detected, use blended average per ₹ */
  RestaurantBlended: 0.085,
  PublicTransport: -0.21
};

const pickFirstNumber = (text) => {
  const normalized = text.replace(/,/g, '');
  const matches = normalized.match(/\d+(?:\.\d+)?/g);
  if (!matches || !matches.length) return null;
  return parseFloat(matches[0], 10);
};

const parseMoneyInr = (text) => {
  const patterns = [
    /(?:grand\s*total|total\s*amount|amount\s*payable|net\s*payable|total\s*due|total\s*:|balance\s*due)\s*[₹]?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
    /₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/,
    /(?:rs\.?|inr)\s*[:\-]?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
    /total\s*[:\-]?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const v = parseFloat(m[1].replace(/,/g, ''), 10);
      if (!Number.isNaN(v) && v > 0) return v;
    }
  }
  const nums = text.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums) return null;
  let best = null;
  for (const n of nums) {
    const v = parseFloat(n, 10);
    if (v > 10 && v < 500000) {
      if (best == null || v > best) best = v;
    }
  }
  return best;
};

/** Line looks like a veg-only section header (not non-veg). */
const isVegHeaderLine = (line) => {
  const t = line.trim();
  const l = t.toLowerCase();
  if (/non\s*vegetarian|non[\s\-]*veg|nonveg|मांसाहारी/.test(l)) return false;
  return (
    /^veg(etarian)?(\s+section|\s+items|\s+total|\s+sub|\s*:|\s*$)/i.test(t) ||
    /^veg(etarian)?\s*[:\-]/i.test(t) ||
    /^\[?\s*veg(etarian)?\s*\]?$/i.test(t)
  );
};

const isNonVegHeaderLine = (line) => {
  const l = line.trim().toLowerCase();
  return /non[\s\-]*veg(?:etarian)?|nonveg|non[-\s]vegetarian|non\s+veg|मांसाहारी|chicken\s*&|meat\s+section/.test(
    l
  );
};

const parseTrailingPrice = (line) => {
  const trimmed = line.trim();
  if (/subtotal|total|tax|gst|cgst|sgst|service|grand|round/i.test(trimmed)) return null;
  const m = trimmed.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ''), 10);
  if (v > 0 && v < 100000) return v;
  return null;
};

const sumItemPricesInLines = (lines) => {
  let sum = 0;
  for (const line of lines) {
    const p = parseTrailingPrice(line);
    if (p != null) sum += p;
  }
  return sum;
};

/**
 * Try "Veg Subtotal ... 450" / "Non-Veg ... 800" style lines (line-by-line to avoid "non veg" → veg confusion).
 */
const trySubtotalsFromKeywords = (text) => {
  let veg = null;
  let nonVeg = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const l = line.toLowerCase();
    const m = line.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*$/);
    if (!m) continue;
    const v = parseFloat(m[1].replace(/,/g, ''), 10);
    if (Number.isNaN(v) || v <= 0) continue;

    const hasSub = /sub\s*total|total|amount|sum|₹|rs\.?|inr/i.test(line);

    if (/non\s*vegetarian|non[\s\-]*veg|nonveg/.test(l) && hasSub) {
      nonVeg = v;
      continue;
    }
    if (!/non/.test(l) && /veg(etarian)?/.test(l) && hasSub) {
      veg = v;
    }
  }

  if (veg != null && veg > 0 && nonVeg != null && nonVeg >= 0) {
    return { vegInr: veg, nonVegInr: nonVeg, method: 'subtotal' };
  }
  if (veg != null && veg > 0) {
    return { vegInr: veg, nonVegInr: nonVeg && nonVeg > 0 ? nonVeg : 0, method: 'subtotal' };
  }
  if (nonVeg != null && nonVeg > 0) {
    return { vegInr: 0, nonVegInr: nonVeg, method: 'subtotal' };
  }
  return null;
};

/**
 * Split bill by section headers and sum item lines in each block.
 */
const trySectionSums = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  let vegIdx = -1;
  let nonVegIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (nonVegIdx < 0 && isNonVegHeaderLine(lines[i])) nonVegIdx = i;
    if (vegIdx < 0 && isVegHeaderLine(lines[i])) vegIdx = i;
  }

  if (vegIdx < 0 && nonVegIdx < 0) return null;

  const collectBetween = (start, end) => {
    const slice = lines.slice(start + 1, end >= 0 ? end : undefined);
    return sumItemPricesInLines(slice);
  };

  let vegInr = 0;
  let nonVegInr = 0;

  if (vegIdx >= 0 && nonVegIdx >= 0) {
    if (vegIdx < nonVegIdx) {
      vegInr = collectBetween(vegIdx, nonVegIdx);
      nonVegInr = collectBetween(nonVegIdx, -1);
    } else {
      nonVegInr = collectBetween(nonVegIdx, vegIdx);
      vegInr = collectBetween(vegIdx, -1);
    }
  } else if (vegIdx >= 0) {
    vegInr = collectBetween(vegIdx, -1);
  } else if (nonVegIdx >= 0) {
    nonVegInr = collectBetween(nonVegIdx, -1);
  }

  if (vegInr <= 0 && nonVegInr <= 0) return null;

  return {
    vegInr: Math.max(0, vegInr),
    nonVegInr: Math.max(0, nonVegInr),
    method: 'sections'
  };
};

const parseRestaurantVegNonVeg = (text) => {
  if (!text || !text.trim()) return null;

  const sub = trySubtotalsFromKeywords(text);
  if (sub && (sub.vegInr > 0 || sub.nonVegInr > 0)) return sub;

  const sec = trySectionSums(text);
  if (sec && (sec.vegInr > 0 || sec.nonVegInr > 0)) return sec;

  return null;
};

const parseKm = (text) => {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:km|kms|kilometers?)\b/i,
    /distance\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:km)\b/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const v = parseFloat(m[1].replace(/,/g, ''), 10);
      if (!Number.isNaN(v) && v > 0 && v < 50000) return v;
    }
  }
  const nums = text.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (nums) {
    for (const n of nums) {
      const v = parseFloat(n, 10);
      if (v >= 0.5 && v <= 2000) return v;
    }
  }
  return null;
};

const extractConsumption = (text, billType) => {
  if (billType === 'Restaurant') {
    return parseMoneyInr(text);
  }
  if (billType === 'PublicTransport') {
    return parseKm(text);
  }

  const patterns = [
    /(?:kwh|k\.?\s*w\.?\s*h|units?|consumption)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:kwh|k\.?\s*w\.?\s*h|units?)/i,
    /(?:liters?|ltr|l)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:liters?|ltr)\b/i,
    /(?:kg|kilograms?)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const v = parseFloat(m[1].replace(/,/g, ''), 10);
      if (!Number.isNaN(v) && v > 0) return v;
    }
  }

  const nums = text.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
  if (nums) {
    for (const n of nums) {
      const v = parseFloat(n, 10);
      if (v > 1 && v < 1e7) return v;
    }
  }

  return pickFirstNumber(text);
};

const unitForType = (billType) => {
  switch (billType) {
    case 'Electricity':
      return 'kWh';
    case 'LPG':
      return 'kg';
    case 'Restaurant':
      return 'INR';
    case 'PublicTransport':
      return 'km';
    default:
      return 'L';
  }
};

const levelFor = (billType, co2) => {
  if (billType === 'PublicTransport') {
    if (co2 < 0) return 'Low';
    if (co2 <= 5) return 'Low';
    if (co2 <= 15) return 'Medium';
    return 'High';
  }
  if (billType === 'Restaurant') {
    if (co2 <= 6) return 'Low';
    if (co2 <= 22) return 'Medium';
    return 'High';
  }

  const thresholds = {
    Electricity: { low: 80, med: 200 },
    Petrol: { low: 40, med: 120 },
    Diesel: { low: 40, med: 120 },
    LPG: { low: 15, med: 40 }
  };
  const t = thresholds[billType] || thresholds.Electricity;
  if (co2 <= t.low) return 'Low';
  if (co2 <= t.med) return 'Medium';
  return 'High';
};

const tipFor = (billType, emissionLevel, restaurantMeta) => {
  if (billType === 'PublicTransport') {
    return 'Using shared transport avoids a lot of per-person driving emissions. Keep it up when you can.';
  }
  if (emissionLevel === 'Low' && billType !== 'Restaurant') {
    return 'Great job keeping footprint low. Keep tracking monthly.';
  }
  if (billType === 'Restaurant') {
    if (restaurantMeta?.method === 'blended_total') {
      return 'Label clear Veg and Non-Veg sections (or subtotals) on the bill for a more accurate split.';
    }
    if (restaurantMeta && restaurantMeta.vegInr > 0 && restaurantMeta.nonVegInr === 0) {
      return 'This bill looks all vegetarian — lower dining emissions from this meal.';
    }
    const share =
      restaurantMeta && restaurantMeta.totalInr > 0
        ? restaurantMeta.nonVegInr / restaurantMeta.totalInr
        : 0;
    if (share > 0.55) {
      return 'A large share of this bill is non-veg — footprint is higher. Balancing with veg meals helps.';
    }
    if (share < 0.25 && nonVegInrSafe(restaurantMeta) > 0) {
      return 'Mostly vegetarian spending on this bill — lower dining emissions. Nice.';
    }
    if (emissionLevel === 'High') {
      return 'Higher dining emissions — try more plant-forward options or smaller non-veg portions when you can.';
    }
    return 'Mixing veg and non-veg affects your footprint: more veg spend generally means lower CO₂ from this bill.';
  }
  if (billType === 'Electricity') {
    return 'Try LED lighting, efficient appliances, and shifting usage off peak hours.';
  }
  if (billType === 'LPG') {
    return 'Ensure burner efficiency and consider insulation to reduce cooking fuel use.';
  }
  return 'Combine trips, maintain vehicle health, and explore lower-carbon travel options.';
};

const nonVegInrSafe = (m) => (m && typeof m.nonVegInr === 'number' ? m.nonVegInr : 0);

/**
 * Parse OCR text and compute CO2 + metadata. Returns null if consumption cannot be inferred.
 */
const calculateCarbon = (extractedText, billType) => {
  if (!extractedText || !billType) return null;

  if (billType === 'Restaurant') {
    const split = parseRestaurantVegNonVeg(extractedText);
    const totalFallback = parseMoneyInr(extractedText);

    if (split && (split.vegInr > 0 || split.nonVegInr > 0)) {
      const vegInr = Math.max(0, split.vegInr);
      const nonVegInr = Math.max(0, split.nonVegInr);
      const co2Emitted = parseFloat(
        (vegInr * FACTORS.RestaurantVeg + nonVegInr * FACTORS.RestaurantNonVeg).toFixed(2)
      );
      const totalInr = vegInr + nonVegInr;
      const consumptionValue = totalInr > 0 ? totalInr : totalFallback;
      if (consumptionValue == null || consumptionValue <= 0) return null;

      const emissionLevel = levelFor('Restaurant', co2Emitted);
      const tip = tipFor('Restaurant', emissionLevel, {
        method: split.method,
        vegInr,
        nonVegInr,
        totalInr: vegInr + nonVegInr
      });

      return {
        consumptionValue,
        consumptionUnit: unitForType('Restaurant'),
        co2Emitted,
        emissionLevel,
        tip,
        vegSpendInr: vegInr,
        nonVegSpendInr: nonVegInr,
        restaurantSplitMethod: split.method === 'subtotal' ? 'subtotal' : 'sections'
      };
    }

    if (totalFallback == null || totalFallback <= 0) return null;
    const co2Emitted = parseFloat((totalFallback * FACTORS.RestaurantBlended).toFixed(2));
    const emissionLevel = levelFor('Restaurant', co2Emitted);
    const tip = tipFor('Restaurant', emissionLevel, { method: 'blended_total' });

    return {
      consumptionValue: totalFallback,
      consumptionUnit: unitForType('Restaurant'),
      co2Emitted,
      emissionLevel,
      tip,
      vegSpendInr: undefined,
      nonVegSpendInr: undefined,
      restaurantSplitMethod: 'blended_total'
    };
  }

  const consumptionValue = extractConsumption(extractedText, billType);
  if (consumptionValue == null || consumptionValue <= 0) return null;

  const factor = FACTORS[billType];
  if (factor === undefined) return null;

  const co2Emitted = parseFloat((consumptionValue * factor).toFixed(2));
  const consumptionUnit = unitForType(billType);
  const emissionLevel = levelFor(billType, co2Emitted);
  const tip = tipFor(billType, emissionLevel);

  return {
    consumptionValue,
    consumptionUnit,
    co2Emitted,
    emissionLevel,
    tip
  };
};

module.exports = { calculateCarbon };
