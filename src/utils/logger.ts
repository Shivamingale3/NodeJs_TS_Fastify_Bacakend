import pino from "pino";
import { env } from "../config/env";

export const loggerConfig = {
  level: env.NODE_ENV === "development" ? "debug" : "info",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          destination: 1,
          colorize: true,
          translateTime: "SYS:standard",
        },
        level: env.NODE_ENV === "development" ? "debug" : "info",
      },
      ...(env.LOKI_HOST
        ? [
            {
              target: "pino-loki",
              options: {
                batching: true,
                interval: 5,
                host: env.LOKI_HOST,
                labels: { application: "fastify-backend" },
              },
              level: "info",
            },
          ]
        : []),
    ],
  },
};

export const logger = pino(loggerConfig);
