export interface TradeResponse {
    data: Trade[]
    type: string
}

// c = conditions
// p = price
// s = symbol
// t = timestamp
// v = volume

export interface Trade {
    c: string[]
    p: number
    s: string
    t: number
    v: number
}