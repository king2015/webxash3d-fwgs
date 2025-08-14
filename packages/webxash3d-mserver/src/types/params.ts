export interface FetchServersParams {
    offset?: number
    max?: number
    game?: string
}

export interface ServeParams {
    connectionID: number
    game: string
    maxPlayers: number
    map: number
}