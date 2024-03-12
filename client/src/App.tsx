import { useCallback, useEffect, useMemo, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Trade } from '../../common/types';
import axios from 'axios';
import { TradeDatabase } from '../../db/src/schema';
import { TradesList } from './components/trades-list';
import { DateRangeSelector } from './components/data-range-selector';
import { PriceChangeCard } from './components/price-change-card';
import { PriceChart } from './components/price-chart';
import { LastPrice } from './components/last-price';
import { useTradesData } from './hooks/useTradesData'
import { useStockWebsocket } from './hooks/useStockWebsocket';
import { calculateTicks, sortTradesInterval } from './lib/utils';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const socketUrl = `ws://localhost:3001`;

export default function App() {
    const [dates, setDates] = useState<[Date, Date]>([new Date(Date.now() - DAY_IN_MS), new Date()]);
    const { tradesByDates, getTradesFromApiByDate } = useTradesData();
    const { messageHistory, connectionStatus } = useStockWebsocket(socketUrl, sortTradesInterval);

    const getTradesFromApi = () => getTradesFromApiByDate(dates[0], dates[1]);

    const sortedMessageHistory = useMemo(() => messageHistory.sort((a, b) => a.t - b.t), [messageHistory]);

    const { minPrice, maxPrice, startTime, endTime } = useMemo(() => {
        const prices = sortedMessageHistory.map((trade: Trade) => trade.p);
        const times = sortedMessageHistory.map((trade: Trade) => trade.t);
        return {
            minPrice: Math.min(...prices) * 0.9995,
            maxPrice: Math.max(...prices) * 1.0005,
            startTime: times[0],
            endTime: times[times.length - 1]
        };
    }, [sortedMessageHistory]);

    const xDomain: [number, number] = useMemo(() => [startTime, endTime], [startTime, endTime]);
    const yDomain: [number, number] = useMemo(() => [minPrice, maxPrice], [minPrice, maxPrice]);

    const xTicks = useMemo(() => calculateTicks(xDomain), [xDomain]);
    const yTicks = useMemo(() => calculateTicks(yDomain), [yDomain]);

    const secondLastPrice = useMemo(() => sortedMessageHistory[sortedMessageHistory.length - 2]?.p, [sortedMessageHistory]);
    const lastPrice = useMemo(() => sortedMessageHistory[sortedMessageHistory.length - 1]?.p, [sortedMessageHistory])

    const priceChangeSinceXPercentage = useCallback((lastTradePrice: number, xMinutesAgo: number) => {
        const xMinutesAgoTimestamp = Date.now() - xMinutesAgo * 60 * 1000;
        const xMinutesAgoTrade = sortedMessageHistory.find((trade) => trade.t >= xMinutesAgoTimestamp);

        if (!xMinutesAgoTrade) {
            return 0;
        }

        return (lastTradePrice - xMinutesAgoTrade?.p) / xMinutesAgoTrade?.p;
    }, [sortedMessageHistory]);

    const priceChangeSince5MinutesAgoPercentage = useMemo(() => priceChangeSinceXPercentage(sortedMessageHistory[sortedMessageHistory.length - 1]?.p, 5), [sortedMessageHistory, priceChangeSinceXPercentage]);

    const priceChangeSince30MinutesAgoPercentage = useMemo(() => priceChangeSinceXPercentage(sortedMessageHistory[sortedMessageHistory.length - 1]?.p, 10), [sortedMessageHistory, priceChangeSinceXPercentage]);

    const priceChangeSince1HourAgoPercentage = useMemo(() => priceChangeSinceXPercentage(sortedMessageHistory[sortedMessageHistory.length - 1]?.p, 60), [sortedMessageHistory, priceChangeSinceXPercentage]);

    // show trades based on the last trade of every minute
    const tradesForChart = useMemo(() => sortTradesInterval(sortedMessageHistory), [sortedMessageHistory]);

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white font-mono p-10 w-[99vw]  overflow-hidden max-w-[99vw] '>
            <div className="w-full h-full flex items-center flex-col justify-center  overflow-hidden">
                <span className={`text-3xl ${connectionStatus === 'Open' ? 'text-green-200' : 'text-red-200'}`}>
                    Websocket: {connectionStatus}
                </span>
                <LastPrice lastPrice={lastPrice} secondLastPrice={secondLastPrice} />
                <PriceChart
                    data={tradesForChart}
                    xDomain={xDomain}
                    yDomain={yDomain}
                    xTicks={xTicks}
                    yTicks={yTicks}
                />
                <div className='flex items-center justify-center gap-4 w-full'>
                    <PriceChangeCard
                        title='5m'
                        percentage={priceChangeSince5MinutesAgoPercentage * 100}
                        isHigher={priceChangeSince5MinutesAgoPercentage > 0}
                    />
                    <PriceChangeCard
                        title='30m'
                        percentage={priceChangeSince30MinutesAgoPercentage * 100}
                        isHigher={priceChangeSince30MinutesAgoPercentage > 0}
                    />
                    <PriceChangeCard
                        title='1h'
                        percentage={priceChangeSince1HourAgoPercentage * 100}
                        isHigher={priceChangeSince1HourAgoPercentage > 0}
                    />
                </div>
                <DateRangeSelector
                    onDateChange={(from, to) => {
                        setDates([from, to]);
                    }}
                    dates={dates}
                />
                <button onClick={getTradesFromApi} className='mt-4 p-2 bg-green-800 rounded-lg'>
                    Get trades from API
                </button>
            </div>
            <TradesList trades={tradesByDates} />
        </div>
    );
}
