import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area } from "recharts"
import { Trade } from "../../../common/types"

export function PriceChart({ data, xDomain, yDomain, xTicks, yTicks }: { data: Trade[], xDomain: number[], yDomain: number[], xTicks: number[], yTicks: number[] }) {
    return (
        <AreaChart
            {...{
                overflow: 'visible'
            }}
            width={1000} height={400} data={data}
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
                    if (payload?.length === 0) return null

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
                strokeWidth={2} fill="url(#colorPrice)" />
        </AreaChart>
    )
}