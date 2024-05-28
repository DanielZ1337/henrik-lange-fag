interface PriceChangeCardProps {
	readonly title: string
	readonly percentage: number
	readonly isHigher: boolean
}

export function PriceChangeCard({ title, percentage, isHigher }: PriceChangeCardProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center ${
				isHigher ? 'text-green-200 bg-green-800' : 'text-red-200 bg-red-800'
			} p-2 rounded-lg`}
		>
			<span className='text-2xl'>{title}</span>
			<span className='text-2xl'>{percentage.toFixed(4)}%</span>
		</div>
	)
}
