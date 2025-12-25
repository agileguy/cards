export const config = {
  port: Number(process.env.PORT) || 2567,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Monitor config
  monitorPath: '/colyseus',

  // Metrics config
  metricsPath: '/metrics',

  // Lobby config
  lobbyTimeoutMs: Number(process.env.LOBBY_TIMEOUT_MS) || 30000,
  lobbyMatchCheckIntervalMs:
    Number(process.env.LOBBY_CHECK_INTERVAL_MS) || 5000,
};
