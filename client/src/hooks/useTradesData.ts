import { useState } from 'react';
import axios from 'axios';
import { TradeDatabase } from '../../../db/src/schema';

export function useTradesData() {
    const [tradesByDates, setTradesByDates] = useState<TradeDatabase[]>([]);

    const getTradesFromApiByDate = async (from: Date, to: Date) => {
        const response = await axios.post('http://localhost:3000/api/trades', {
            from: from.getTime(),
            to: to.getTime(),
        });
        setTradesByDates(response.data);
    };

    return { tradesByDates, getTradesFromApiByDate };
}
