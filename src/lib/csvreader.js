function parseCSVLine(line) {
  var cols = [];
  var field = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { cols.push(field); field = ''; continue; }
    field += ch;
  }
  cols.push(field);
  return cols;
}

function parseNum(val) {
  if (!val || val === 'NA' || val === 'NaN') return undefined;
  var n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

function parseRows(csv) {
  var lines = csv.split('\n').slice(1);
  var rows = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.trim()) continue;
    var cols = parseCSVLine(line);
    var type = cols[1];
    var strike = parseFloat(cols[2]);
    var expiration = cols[3].trim();
    var bid = parseFloat(cols[5]);
    var ask = parseFloat(cols[6]);
    var vol = parseNum(cols[7]);
    var iv = parseNum(cols[15]);
    var delta = parseNum(cols[18]);
    var gamma = parseNum(cols[19]);
    var theta = parseNum(cols[20]);
    var vega = parseNum(cols[21]);

    if (isNaN(strike) || isNaN(bid) || isNaN(ask)) continue;

    rows.push({
      type: type,
      strike: strike,
      expiration: expiration,
      bid: bid,
      ask: ask,
      iv: iv,
      delta: delta,
      gamma: gamma,
      theta: theta,
      vega: vega,
      volume: vol,
    });
  }

  return rows;
}

function buildChains(rows) {
  var byExpiration = {};

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!byExpiration[row.expiration]) {
      byExpiration[row.expiration] = {};
    }
    var strikeMap = byExpiration[row.expiration];
    if (!strikeMap[row.strike]) {
      strikeMap[row.strike] = {};
    }
    var entry = strikeMap[row.strike];
    if (row.type === 'C') entry.call = row;
    else entry.put = row;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var dates = Object.keys(byExpiration).sort();
  var chains = [];

  for (var d = 0; d < dates.length; d++) {
    var date = dates[d];
    var strikeMap = byExpiration[date];
    var expDate = new Date(date + 'T00:00:00');
    var dte = Math.max(0, Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    var strikes = Object.keys(strikeMap).map(Number).sort(function(a, b) { return a - b; });
    var contracts = [];

    for (var s = 0; s < strikes.length; s++) {
      var strike = strikes[s];
      var c = strikeMap[strike].call;
      var p = strikeMap[strike].put;

      contracts.push({
        strike: strike,
        callBid: c ? c.bid : 0,
        callAsk: c ? c.ask : 0,
        callIV: c ? (c.iv || 0) : 0,
        callDelta: c ? (c.delta || 0) : 0,
        callGamma: c ? (c.gamma || 0) : 0,
        callTheta: c ? (c.theta || 0) : 0,
        callVega: c ? (c.vega || 0) : 0,
        callVolume: c ? (c.volume || 0) : 0,
        callOI: 0,
        putBid: p ? p.bid : 0,
        putAsk: p ? p.ask : 0,
        putIV: p ? (p.iv || 0) : 0,
        putDelta: p ? (p.delta || 0) : 0,
        putGamma: p ? (p.gamma || 0) : 0,
        putTheta: p ? (p.theta || 0) : 0,
        putVega: p ? (p.vega || 0) : 0,
        putVolume: p ? (p.volume || 0) : 0,
        putOI: 0,
      });
    }

    chains.push({ date: date, dte: dte, contracts: contracts });
  }

  return chains;
}

/**
 * Read options data from CSV text.
 * @param {string} csvText - raw CSV content
 * @returns {Array} [{date, dte, contracts: [{strike, callBid, callAsk, ...}]}, ...]
 */
export function readCSVOptionsData(csvText) {
  var rows = parseRows(csvText);
  return buildChains(rows);
}
