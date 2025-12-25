export const config = {
    port: Number(process.env.PORT) || 2567,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Monitor config
    monitorPath: '/colyseus',

    // Metrics config
    metricsPath: '/metrics',
};
