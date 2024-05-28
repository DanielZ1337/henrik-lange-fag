import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { Trade } from '@common/types'

interface PriceChartProps {
	readonly data: Trade[]
	readonly xDomain: number[]
	readonly yDomain: number[]
	readonly xTicks: number[]
	readonly yTicks: number[]
}

export function PriceChart({ data, xDomain, yDomain, xTicks, yTicks }: PriceChartProps) {
	return (
		<AreaChart
			{...{
				overflow: 'visible',
			}}
			width={1000}
			height={400}
			data={data}
			margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
		>
			<defs>
				<linearGradient
					id='colorPrice'
					x1='0'
					y1='0'
					x2='0'
					y2='1'
				>
					<stop
						offset='5%'
						stopColor='#8884d8'
						stopOpacity={0.8}
					/>
					<stop
						offset='95%'
						stopColor='#8884d8'
						stopOpacity={0}
					/>
				</linearGradient>
			</defs>
			<XAxis
				dataKey='t'
				domain={xDomain}
				ticks={xTicks}
				type='number'
				tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
			/>
			<YAxis
				domain={yDomain}
				ticks={yTicks}
				tickFormatter={(value) => value.toFixed(2)}
				type='number'
			/>
			<CartesianGrid strokeDasharray='3 3' />
			<Tooltip
				content={({ payload }) => {
					const trade = payload?.[0]?.payload as Trade

					if (!trade) {
						return null
					}

					return <PriceChartContent trade={trade} />
				}}
			/>
			<Area
				isAnimationActive={false}
				type='monotone'
				dataKey='p'
				stroke='#8884d8'
				fillOpacity={1}
				strokeWidth={2}
				fill='url(#colorPrice)'
			/>
		</AreaChart>
	)
}

function PriceChartContent({ trade }: { readonly trade: Trade }) {
	return (
		<div className='flex flex-col items-center justify-center gap-4 bg-zinc-800 p-4 rounded-lg mt-4 w-fit h-full max-w-[99vw]  overflow-hidden'>
			<span className='bg-zinc-700 rounded-lg p-2'>Price: {trade.p}</span>
			<span>Volume: {trade.v}</span>
			<span>Timestamp: {new Date(trade.t).toLocaleString()}</span>
		</div>
	)
}
