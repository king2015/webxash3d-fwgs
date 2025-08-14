export interface FetchServersParams {
    offset?: number
    limit?: number
    game?: string
}

export interface ICEServer {
    urls: string | string[]
    username?: string
    credential?: string
}

export interface ServeParams {
    connectionID: number
    name: string
    game: string
    maxPlayers: number
    map: string
    iceServers?: ICEServer[]
}