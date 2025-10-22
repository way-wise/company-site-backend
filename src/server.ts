import { createServer, Server } from "http";
import app from "./app";
import config from "./config/config";
import { initializeSocket } from "./socket";

let server: Server;
let httpServer: ReturnType<typeof createServer>;

async function main() {
  // Create HTTP server
  httpServer = createServer(app);

  // Initialize Socket.io
  initializeSocket(httpServer);

  server = httpServer.listen(config.port, () => {
    console.log(
      `🚀 Server ready at: http://localhost:${config.port} and the process id is ${process.pid}`
    );
    console.log(
      `💬 Socket.io initialized and ready for real-time communication`
    );
  });
}

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.info("Server is shutting down");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  console.log(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

/* 
this will get fired upon stopping server by pressing ctrl + c
process.on('SIGINT', () => {
   console.log('SIGINT signal received');
   unexpectedErrorHandler('SIGINT signal received');
}); 
*/

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received");
  unexpectedErrorHandler("SIGTERM signal received");
});

main();
