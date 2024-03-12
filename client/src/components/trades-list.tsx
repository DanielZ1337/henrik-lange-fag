import {TradeDatabase} from "../../../db/src/schema";

export function TradesList({trades}: { trades: TradeDatabase[] }) {
    return (
        <div
            className='flex flex-col items-center justify-center gap-4 bg-zinc-800 p-4 rounded-lg mt-4 w-fit h-full max-w-[99vw]  overflow-hidden'>
            {trades.map((trade) => (
                <div key={String(trade.timestamp)}
                     className='flex items-center justify-center gap-4 w-full bg-zinc-900 p-4 rounded-lg'>
                    <span className='bg-zinc-700 rounded-lg p-2'>{trade.price}</span>
                    <span>{trade.volume}</span>
                    <span>{new Date(trade.timestamp).toLocaleString()}</span>
                </div>
            ))}
        </div>
    )
}