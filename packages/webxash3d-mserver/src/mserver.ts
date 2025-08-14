import {Connection} from "./connection";
import {FetchServersParams, ServeParams} from "./types";
import {Server} from "./server";

export class MServer {
    public readonly connections = new Map<number, Connection>
    public readonly servers = new Map<string, Server[]>

    onClient() {
        const connection = new Connection()
        this.connections.set(connection.id, connection)

        return connection
    }

    onClientDisconnect(id: number) {
        this.stopServer(id)
        this.connections.delete(id)
    }

    fetchServers(params: FetchServersParams = {}) {
        const {
            game = 'valve',
            offset = 0,
            limit = 10
        } = params
        const allServers = this.servers.get(game) ?? []
        const servers = allServers.slice(offset, offset + limit)

        return {
            servers,
            offset,
            limit,
            total: allServers.length,
        }
    }

    stopServer(connectionID: number) {
        const connection = this.connections.get(connectionID)
        if (!connection?.server) return;

        const game = connection.server.params.game
        const servers = this.servers.get(game)
        if (!servers) return;

        const newServers = servers.filter(s => s.params.connectionID !== connectionID)
        if (newServers.length) {
            this.servers.set(game, newServers)
        } else {
            this.servers.delete(game)
        }

        delete connection.server
    }

    serve(params: ServeParams) {
        const connection = this.connections.get(params.connectionID)
        if (!connection) return

        this.stopServer(params.connectionID)

        connection.server = new Server(params)
        const servers = this.servers.get(params.game) ?? []
        servers.push(connection.server)
        this.servers.set(params.game, servers)
    }
}