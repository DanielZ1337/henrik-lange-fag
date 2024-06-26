interface LastPriceProps {
	readonly symbol: string
	readonly lastPrice: number
	readonly secondLastPrice: number
}

export function LastPrice({ symbol, lastPrice, secondLastPrice }: LastPriceProps) {
	const isSame = parseFloat(Number(lastPrice).toFixed(2)) === parseFloat(Number(secondLastPrice).toFixed(2))
	const isHigher = parseFloat(Number(lastPrice).toFixed(2)) > parseFloat(Number(secondLastPrice).toFixed(2))

	return (
		<div className='transition-all duration-200 flex items-center justify-center'>
			<span className='text-2xl'>Last Price for {symbol}:</span>
			<div
				className={`transition-all duration-200 ml-2 w-fit mx-auto rounded-lg px-4 text-2xl ${
					isHigher ? 'text-green-200 bg-green-800' : 'text-red-200 bg-red-800'
				} p-2 ${isSame && '!bg-gray-800 !text-gray-200'}`}
			>
				<span>{lastPrice}</span>
			</div>
		</div>
	)
}
