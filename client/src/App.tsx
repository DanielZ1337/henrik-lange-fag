import { useState, useCallback, useEffect, useMemo } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Trade } from '../../common/types';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';


function App() {
  const socketUrl = `ws://localhost:3000`;
  const [messageHistory, setMessageHistory] = useState<Trade[]>([]);

  const { lastMessage, readyState } = useWebSocket(socketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      const parsedData = JSON.parse(lastMessage.data) as Trade[];

      setMessageHistory((prev) => prev.concat(parsedData));
    }
  }, [lastMessage, setMessageHistory]);

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

  return (
    <div className='w-screen flex flex-col items-center justify-center h-screen bg-zinc-900 text-white font-mono'>
      <span
        className={`text-3xl ${isHigher && !isSame ? 'text-green-200' : 'text-red-200'} p-2`}
      >The WebSocket is currently {connectionStatus}</span>
      {lastMessage && (
        <div
          className={`w-fit mx-auto rounded-lg px-4 text-2xl ${isHigher ? 'text-green-200 bg-green-800' : 'text-red-200 bg-red-800'} p-2 ${isSame && '!bg-gray-800 !text-gray-200'}`}
        >
          <span>{sortedMessageHistory[sortedMessageHistory.length - 1]?.p}</span>
        </div>
      )}
      <AreaChart
        {...{
          overflow: 'visible'
        }}
        width={1200} height={500} data={sortedMessageHistory}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
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
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip
          content={({ payload }) => {
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
        <Area isAnimationActive={false} type="monotone" dataKey="p" stroke="#8884d8" fillOpacity={1} strokeWidth={2} fill="url(#colorPrice)" />
      </AreaChart>
    </div>
  );
}

export default App;