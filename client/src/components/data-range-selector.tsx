export function DateRangeSelector({dates, onDateChange}: {
    dates: Date[],
    onDateChange: (from: Date, to: Date) => void
}) {
    const DAY_IN_MS = 1000 * 60 * 60 * 24;

    return (
        <div className='flex items-center justify-center gap-4 mt-4'>
            <input
                type='date'
                value={dates[0].toISOString().split('T')[0]} onChange={(e) => {
                const date = new Date(e.target.value);
                onDateChange(date, dates[1]);
            }}
            />
            <input
                type='date'
                value={dates[1].toISOString().split('T')[0]}
                onChange={(e) => {
                    const date = new Date(e.target.value);
                    onDateChange(dates[0], date);
                }}
            />
            <button
                onClick={() => onDateChange(new Date(Date.now() - DAY_IN_MS), new Date(Date.now() + DAY_IN_MS))}>Today
            </button>
            <button onClick={() => onDateChange(new Date(Date.now() - DAY_IN_MS), new Date())}>Yesterday</button>
            <button onClick={() => onDateChange(new Date(Date.now() - DAY_IN_MS * 7), new Date())}>Last 7 days</button>
        </div>
    )
}