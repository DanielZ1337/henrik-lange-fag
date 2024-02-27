import {useCallback, useEffect, useMemo, useState} from 'react';
import useWebSocket, {ReadyState} from 'react-use-websocket';
import {Trade} from '../../common/types';
import {Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis} from 'recharts';


function App() {
    const socketUrl = `ws://localhost:3001`;
    const [messageHistory, setMessageHistory] = useState<Trade[]>([]);

    const {lastMessage, readyState} = useWebSocket(socketUrl);

    const MAX_MESSAGE_HISTORY = 150000;

    useEffect(() => {
        if (lastMessage !== null) {
            const parsedData = JSON.parse(lastMessage.data) as Trade[];
            const sortedTrades = parsedData.sort((a, b) => a.t - b.t);

            // get every minute
            const trades: Trade[] = [];
            let lastMinute = 0;
            sortedTrades.forEach((trade) => {
                const date = new Date(trade.t);
                if (date.getMinutes() !== lastMinute) {
                    trades.push(trade);
                    lastMinute = date.getMinutes();
                }
            });


            setMessageHistory((prev) => {
                const updatedHistory = prev.concat(trades);
                if (updatedHistory.length > MAX_MESSAGE_HISTORY) {
                    return updatedHistory.slice(undefined, MAX_MESSAGE_HISTORY);
                }
                return updatedHistory;
            });
        }
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
        return [start, start + middle, end];
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

    const isSame = useMemo(() => parseFloat(Number(lastPrice).toFixed(2)) === parseFloat(Number(secondLastPrice).toFixed(2)), [lastPrice, secondLastPrice]);

    const isHigher = useMemo(() => {
        const lastPriceFixed = parseFloat(Number(lastPrice).toFixed(2));
        const secondLastPriceFixed = parseFloat(Number(secondLastPrice).toFixed(2));
        return lastPriceFixed > secondLastPriceFixed;
    }, [lastPrice, secondLastPrice]);

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
    const tradesForChart = useMemo(() => {
        const trades: Trade[] = [];
        let lastMinute = 0;
        sortedMessageHistory.forEach((trade) => {
            const date = new Date(trade.t);
            if (date.getMinutes() !== lastMinute) {
                trades.push(trade);
                lastMinute = date.getMinutes();
            }
        });

        return trades;
    }, [sortedMessageHistory]);

    return (
        <div className='w-screen flex flex-col items-center justify-center h-screen bg-zinc-900 text-white font-mono'>
      <span
          className={`text-3xl ${connectionStatus === 'Open' ? 'text-green-200' : 'text-red-200'}`}
      >Websocket: {connectionStatus}</span>
            <div
                className='flex items-center justify-center'
            >
                <span className='text-2xl'>Last Price for BTC/USDT:</span>
                {lastMessage && (
                    <div
                        className={`ml-2 w-fit mx-auto rounded-lg px-4 text-2xl ${isHigher ? 'text-green-200 bg-green-800' : 'text-red-200 bg-red-800'} p-2 ${isSame && '!bg-gray-800 !text-gray-200'}`}
                    >
                        <span>{sortedMessageHistory[sortedMessageHistory.length - 1]?.p}</span>
                    </div>
                )}
            </div>
            <AreaChart
                {...{
                    overflow: 'visible'
                }}
                width={1200} height={500} data={tradesForChart}
                margin={{top: 10, right: 30, left: 0, bottom: 0}}
            >
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="t"
                       domain={xDomain}
                       ticks={xTicks}
                       type="number"
                       tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
                />
                <YAxis
                    domain={yDomain}
                    ticks={yTicks}
                    tickFormatter={(value) => value.toFixed(2)}
                    type='number'
                />
                <CartesianGrid strokeDasharray="3 3"/>
                <Tooltip
                    content={({payload}) => {
                        if (payload?.length === 0) {
                            return null
                        }
                        const trade = payload?.[0].payload as Trade

                        return (
                            <div className='bg-zinc-800 p-4 shadow-md rounded-md'>
                                <div>Price: {trade.p}</div>
                                <div>Volume: {trade.v}</div>
                                <div>Timestamp: {new Date(trade.t).toLocaleString()}</div>
                            </div>
                        )
                    }}
                />
                <Area isAnimationActive={false} type="monotone" dataKey="p" stroke="#8884d8" fillOpacity={1}
                      strokeWidth={2} fill="url(#colorPrice)"/>
            </AreaChart>
            <div className='flex items-center justify-center gap-4 w-full'>
                <PriceChangeCard title='5m' percentage={priceChangeSince5MinutesAgoPercentage * 100}
                                 isHigher={priceChangeSince5MinutesAgoPercentage > 0}/>
                <PriceChangeCard title='30m' percentage={priceChangeSince30MinutesAgoPercentage * 100}
                                 isHigher={priceChangeSince30MinutesAgoPercentage > 0}/>
                <PriceChangeCard title='1h' percentage={priceChangeSince1HourAgoPercentage * 100}
                                 isHigher={priceChangeSince1HourAgoPercentage > 0}/>
            </div>
        </div>
    );
}

export default App;

function PriceChangeCard({title, percentage, isHigher}: { title: string, percentage: number, isHigher: boolean }) {
    return (
        <div
            className={`flex flex-col items-center justify-center ${isHigher ? 'text-green-200 bg-green-800' : 'text-red-200 bg-red-800'} p-2 rounded-lg`}>
            <span className='text-2xl'>{title}</span>
            <span className='text-2xl'>{percentage.toFixed(4)}%</span>
        </div>
    )
}