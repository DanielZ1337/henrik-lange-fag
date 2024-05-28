import { useState } from 'react'
import axios from 'axios'
import { TradeDatabase } from '@common/types'

export function useTradesData() {
	const [tradesByDates, setTradesByDates] = useState<TradeDatabase[]>([])

	const getTradesFromApiByDate = async (from: Date, to: Date) => {
		const response = await axios.post('http://localhost:3000/api/trades', {
			from: from.getTime(),
			to: to.getTime(),
		})

		const json = response.data

		if ('error' in json) {
			throw new Error('unknown error')
		}

		setTradesByDates(
			json.map(
				(trade: {
					id: number
					c: string | null
					p: string
					s: string
					t: Date
					v: string
					createdAt: Date
					updatedAt: Date
				}) => ({
					...trade,
					createdAt: new Date(trade.createdAt),
					updatedAt: new Date(trade.updatedAt),
					t: new Date(trade.t),
				})
			)
		)
	}

	return { tradesByDates, getTradesFromApiByDate }
}
