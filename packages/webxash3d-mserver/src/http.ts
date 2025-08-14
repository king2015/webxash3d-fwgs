import Fastify, {FastifyInstance, FastifyPluginAsync} from 'fastify';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import pino from 'pino'
import {MServer} from "./mserver";
import {FetchServersParams} from "./types";
import packageInfo from '../package.json'

export interface HTTPMServerConfig {
    port: number
    disableDocs?: boolean
    logLevel?: pino.Level
    enablePrettyLogs?: boolean
}

export class HTTPMServer extends MServer {
    public readonly fastify: FastifyInstance
    public config: HTTPMServerConfig

    constructor(config: HTTPMServerConfig) {
        super()

        this.config = config

        this.fastify = Fastify({
            logger: {
                transport: config.enablePrettyLogs
                    ? {
                        target: 'pino-pretty',
                    }
                    : undefined,
                level: config.logLevel,
            }
        });

        this.fastify.register(websocket);

        if (!this.config.disableDocs) {
            this.fastify.register(swagger, {
                swagger: {
                    info: {
                        title: packageInfo.name,
                        description: packageInfo.description,
                        version: packageInfo.version,
                    },
                },
            });
            this.fastify.register(swaggerUI, {
                routePrefix: '/docs',
                uiConfig: {
                    docExpansion: 'full',
                    deepLinking: false
                }
            });
        }

        this.fastify.register(this.httpRoutes)


        const connection = this.onClient()
        this.serve({
            name: 'my server',
            game: 'valve',
            connectionID: connection.id,
            map: 'crossfire',
            maxPlayers: 12,
            iceServers: [
                {urls: ['1', '2']}
            ]
        })
    }


    private httpRoutes: FastifyPluginAsync = async (fastify) => {
        fastify.get('/', {
            schema: {
                description: 'Returns UNIX timestamp of the server. Can be used as a health check',
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            time: {type: 'integer'}
                        },
                        required: ['time'],
                        additionalProperties: false
                    }
                }
            }
        }, async () => {
            return {
                time: Math.floor(Date.now() / 1000)
            }
        });

        fastify.get('/v1/servers', {
            schema: {
                description: 'Fetch paginated list of available servers',
                querystring: {
                    type: 'object',
                    properties: {
                        offset: {type: 'integer', minimum: 0, default: 0},
                        limit: {type: 'integer', minimum: 1, maximum: 10, default: 10},
                        game: {type: 'string', default: 'valve'}
                    },
                    additionalProperties: false
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            servers: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: {type: 'string'},
                                        address: {type: 'integer'},
                                        maxPlayers: {type: 'integer'},
                                        map: {type: 'string'},
                                        iceServers: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    urls: {
                                                        oneOf: [
                                                            {type: "string"},
                                                            {
                                                                type: "array",
                                                                items: {type: "string"},
                                                                minItems: 1
                                                            }
                                                        ]
                                                    },
                                                    username: {type: 'string'},
                                                    credential: {type: 'string'},
                                                },
                                                required: ['urls'],
                                                additionalProperties: false
                                            }
                                        }
                                    },
                                    required: ['name', 'address', 'maxPlayers', 'map'],
                                    additionalProperties: false
                                }
                            },
                            offset: {type: 'integer'},
                            limit: {type: 'integer'},
                            total: {type: 'integer'}
                        }
                    }
                }
            }
        }, async (request) => {
            return this.fetchServers(request.query as FetchServersParams);
        });
    }


    async start() {
        await this.fastify.listen({port: this.config.port});
    }
}