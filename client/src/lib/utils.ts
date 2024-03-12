import { Trade } from "../../../common/types";

export function calculateTicks(domain: [number, number]) {
    const [start, end] = domain;
    const middle = (end - start) / 2;
    return [start, start + middle, end];
}

export function sortTradesInterval(trades: Trade[]) {
    const sortedTrades = trades.sort((a, b) => a.t - b.t);
    const tradesByInterval: Trade[] = [];
    let lastMinute = 0;
    sortedTrades.forEach((trade) => {
        const date = new Date(trade.t);
        if (date.getMinutes() !== lastMinute) {
            tradesByInterval.push(trade);
            lastMinute = date.getMinutes();
        } else {
            tradesByInterval[tradesByInterval.length - 1] = trade;
        }
    });

    return tradesByInterval;
}