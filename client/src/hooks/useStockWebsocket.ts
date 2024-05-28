import { useCallback, useEffect, useState } from 'react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { Trade } from '@common/types'

type ProcessDataFunction = (data: Trade[]) => Trade[]

export function useStockWebsocket(
	socketUrl: string,
	processDataCallback: ProcessDataFunction,
	maxHistory: number = 150000
) {
	const [messageHistory, setMessageHistory] = useState<Trade[]>([])
	const { lastMessage, readyState } = useWebSocket(socketUrl)

	const handleNewData = useCallback(
		(data: Trade[]) => {
			const newData = processDataCallback(data)
			setMessageHistory((prev) => {
				return [...prev, ...newData].slice(-maxHistory)
			})
		},
		[processDataCallback, maxHistory]
	)

	useEffect(() => {
		if (!lastMessage) return

		const newData = JSON.parse(lastMessage.data) as Trade[]
		handleNewData(newData)
	}, [lastMessage, handleNewData])

	const connectionStatus = {
		[ReadyState.CONNECTING]: 'Connecting',
		[ReadyState.OPEN]: 'Open',
		[ReadyState.CLOSING]: 'Closing',
		[ReadyState.CLOSED]: 'Closed',
		[ReadyState.UNINSTANTIATED]: 'Uninstantiated',
	}[readyState]

	return { messageHistory, readyState, connectionStatus }
}
