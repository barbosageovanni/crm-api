declare class RedisService {
    private client;
    private isConnected;
    private connectionAttempted;
    constructor();
    private setupEventHandlers;
    /**
     * Tenta estabelecer conexão com verificação prévia de disponibilidade
     */
    connect(): Promise<void>;
    /**
     * Conecta apenas se necessário e possível
     */
    connectIfNeeded(): Promise<boolean>;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    del(patternOrKey: string | string[]): Promise<number>;
    flush(): Promise<boolean>;
    /**
     * Verifica se está saudável e pronto
     */
    isHealthy(): boolean;
    /**
     * Testa conectividade com ping
     */
    ping(): Promise<boolean>;
    /**
     * Encerra conexão graciosamente
     */
    disconnect(): Promise<void>;
    /**
     * Informações de status para debug
     */
    getStatus(): {
        isConnected: boolean;
        clientStatus: string;
        isHealthy: boolean;
    };
}
export declare const redisService: RedisService;
export declare const CACHE_KEYS: {
    readonly CLIENTE_LIST: "cliente:list";
    readonly CLIENTE_BY_ID: "cliente:id";
    readonly CLIENTE_STATS: "cliente:stats";
};
export declare const CACHE_TTL: {
    readonly SHORT: 60;
    readonly MEDIUM: number;
    readonly LONG: number;
    readonly VERY_LONG: number;
};
export {};
//# sourceMappingURL=redis.d.ts.map