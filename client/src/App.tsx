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

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function sortTradesInterval(trades: Trade[]) {
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

export default function App() {
    const socketUrl = `ws://localhost:3001`;
    const [messageHistory, setMessageHistory] = useState<Trade[]>([]);
    const [dates, setDates] = useState<Date[]>([new Date(Date.now() - DAY_IN_MS), new Date()]);
    const [tradesByDates, setTradesByDates] = useState<TradeDatabase[]>([]);

    const { lastMessage, readyState } = useWebSocket(socketUrl);

    const MAX_MESSAGE_HISTORY = 150000;

    const getTradesFromApiByDate = async () => {
        const response = await axios.post('http://localhost:3000/api/trades', {
            from: dates[0].getTime(),
            to: dates[1].getTime()
        });

        const trades = response.data as TradeDatabase[];

        setTradesByDates(trades);
    }

    useEffect(() => {
        if (lastMessage === null) return

        const parsedData = JSON.parse(lastMessage.data) as Trade[];
        const tradesByInterval = sortTradesInterval(parsedData);

        setMessageHistory((prev) => {
            const updatedHistory = prev.concat(tradesByInterval);
            if (updatedHistory.length > MAX_MESSAGE_HISTORY) {
                return updatedHistory.slice(undefined, MAX_MESSAGE_HISTORY);
            }
            return updatedHistory;
        });
    }, [lastMessage]);

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const sortedMessageHistory = useMemo(() => messageHistory.sort((a, b) => a.t - b.t), [messageHistory]);
    const minValue = useCallback(() => Math.min(...sortedMessageHistory.map((trade) => trade.p)) * 0.9995, [sortedMessageHistory]);
    const maxValue = useCallback(() => Math.max(...sortedMessageHistory.map((trade) => trade.p)) * 1.0005, [sortedMessageHistory]);

    const yDomain = useMemo(() => [minValue(), maxValue()], [minValue, maxValue]);
    const xDomain = useMemo(() => [sortedMessageHistory[0]?.t, sortedMessageHistory[sortedMessageHistory.length - 1]?.t], [sortedMessageHistory]);
    const xTicks = useMemo(() => {
        const start = xDomain[0];
        const end = xDomain[1];
        const middle = (end - start) / 2;
        return [start, start + middle, end].map((value) => value);
    }, [xDomain]);

    const yTicks = useMemo(() => {
        const start = yDomain[0];
        const end = yDomain[1];
        const middle = (end - start) / 2;

        // format the numbers
        return [start, start + middle, end].map((value) => value);
    }, [yDomain]);

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
                    <PriceChangeCard title='5m' percentage={priceChangeSince5MinutesAgoPercentage * 100}
                        isHigher={priceChangeSince5MinutesAgoPercentage > 0} />
                    <PriceChangeCard title='30m' percentage={priceChangeSince30MinutesAgoPercentage * 100}
                        isHigher={priceChangeSince30MinutesAgoPercentage > 0} />
                    <PriceChangeCard title='1h' percentage={priceChangeSince1HourAgoPercentage * 100}
                        isHigher={priceChangeSince1HourAgoPercentage > 0} />
                </div>
                <DateRangeSelector
                    onDateChange={(from, to) => {
                        setDates([from, to]);
                    }}
                    dates={dates}
                />
                <button
                    onClick={getTradesFromApiByDate}
                    className='mt-4 p-2 bg-green-800 rounded-lg'
                >
                    Get trades from API
                </button>
            </div>
            <TradesList trades={tradesByDates} />
        </div>
    );
}
