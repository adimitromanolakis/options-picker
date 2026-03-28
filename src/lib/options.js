/**
 * Compute P&L at a single price point for a set of option legs.
 */
function calculatePayoff(legs, price) {
  let totalPayoff = 0;
  for (const leg of legs) {
    const intrinsic = leg.type === 'call'
      ? Math.max(0, price - leg.strike)
      : Math.max(0, leg.strike - price);

    if (leg.position === 'long') {
      totalPayoff += (intrinsic - leg.premium) * leg.quantity * 100;
    } else {
      totalPayoff += (leg.premium - intrinsic) * leg.quantity * 100;
    }
  }
  return totalPayoff;
}

/**
 * Compute the full payoff diagram over a price range.
 * @param {Array} legs - [{type:'call'|'put', position:'long'|'short', strike, premium, quantity}]
 * @param {number} spot - underlying spot price
 * @param {number} rangeOffset - +/- range from rounded spot (default 50)
 * @param {number} step - price step (default 0.2)
 * @returns {Array} [{price, pnl}, ...]
 */
export function calculateOptionsFuture(legs, spot, rangeOffset, step) {
  rangeOffset = rangeOffset || 50;
  step = step || 0.2;

  var roundedSpot = Math.round(spot);
  var min = roundedSpot - rangeOffset;
  var max = roundedSpot + rangeOffset;
  var points = [];

  for (var p = min; p <= max + step / 2; p += step) {
    var price = Math.round(p * 10) / 10;
    points.push({
      price: price,
      pnl: Math.round(calculatePayoff(legs, price) * 100) / 100,
    });
  }
  return points;
}
