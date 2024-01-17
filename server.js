const cluster = require('cluster');
const os = require('os');
const fs = require('fs');
const basePort = 3000;
let isMasterActive = true;

if (cluster.isMaster) {
    // Master process
    console.log(`Master ${process.pid} is running`);

    // Fork workers based on the number of CPU cores
    for (let i = 0; i < 9; i++) {
        const worker = cluster.fork();
        worker.on('listening', (address) => {
            // Save the assigned port to a file
            fs.writeFileSync(`worker${worker.id}_port.txt`, String(address.port));
        });
    }

    // Handle worker exit and restart
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        if (isMasterActive) {
            cluster.fork();
        }
    });

    // Example: Periodically check the health of the active master
    setInterval(() => {
        const activeWorkers = Object.values(cluster.workers).filter(worker => worker.isConnected());
       
        if (activeWorkers.length === 0) {
            console.log('Active master is down. Promoting a passive node.');
            isMasterActive = false;
            // Fork a new worker to promote a passive node to active
            cluster.fork();
        }
    }, 5000); // Check every 5 seconds
} else {
    // Worker process
    console.log(`Worker ${process.pid} started`);
    const workerPort = basePort + cluster.worker.id;

    // Your Node.js application logic goes here

    // For example, start an HTTP server
    const http = require('http');
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`Hello from worker! ${process.pid}\n`);
    });

    server.listen(workerPort, '127.0.0.1', () => {
        // Notify the master process about the listening event
        process.send({ event: 'listening', address: server.address() });
    });

    console.log(`Worker ${process.pid} listening on port ${workerPort}`);
}
