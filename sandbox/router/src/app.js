import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";
import http from "http";
import { createProxyServer } from "httpxy";

const app = express();


app.use((req, res, next) => {
    console.log("Host:", req.headers.host);
    console.log("URL :", req.url);
    next();
});


app.use(morgan("combined"));

app.get("/api/status/healthz", (req, res) => {
    res.status(200).json({ status: "OK" });
});
app.get("/api/status/readyz", (req, res) => {
    res.status(200).json({ status: "ready" });
});

const proxies = {};
const agentProxies = {};

const wsProxy = createProxyServer({
    changeOrigin: true,
});

wsProxy.on("error", (err, req, socket) => {
    console.error("WS Proxy Error:", err.message);
    socket?.destroy();
});

function getProxy(sandboxId) {
    const target=`http://sandbox-service-${sandboxId}`;

    if(!proxies[sandboxId]) {
        proxies[sandboxId] = createProxyMiddleware({
            target,
            changeOrigin: true,
        });
    }
    return proxies[sandboxId];
}

function getAgentProxy(sandboxId) {
    const target=`http://sandbox-service-${sandboxId}:3000`;

    if(!agentProxies[sandboxId]) {
        agentProxies[sandboxId] = createProxyMiddleware({
            target,
            changeOrigin: true,
        });
    }
    return agentProxies[sandboxId];
}

app.use((req, res, next) => {
    const host = req.headers.host;
    const sandboxId=host.split(".")[0];

    if(host.split(".")[1] ==='agent'){
        return getAgentProxy(sandboxId)(req,res,next);
    }
    
    else if(host.split(".")[1] ==='preview'){
        return getProxy(sandboxId)(req,res,next);
    }
    


});

const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {

    const host = req.headers.host;

    if (!host) {
        socket.destroy();
        return;
    }

    const sandboxId = host.split(".")[0];
    const type = host.split(".")[1];

    if (type === "preview") {

        wsProxy.ws(
            req,
            socket,
            {
                target: `http://sandbox-service-${sandboxId}`,
            },
            head
        ).catch(() => socket.destroy());

    } else if (type === "agent") {

        wsProxy.ws(
            req,
            socket,
            {
                target: `http://sandbox-service-${sandboxId}:3000`,
            },
            head
        ).catch(() => socket.destroy());

    } else {
        socket.destroy();
    }
});

export default server;
