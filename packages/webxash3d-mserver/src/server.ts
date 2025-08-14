import {ServeParams} from "./types";

export class Server {
    public readonly params

    constructor(params: ServeParams) {
        this.params = params
    }

    toJSON() {
        return {
            name: this.params.name,
            address: this.params.connectionID,
            maxPlayers: this.params.maxPlayers,
            map: this.params.map,
            iceServers: this.params.iceServers,
        }
    }
}
