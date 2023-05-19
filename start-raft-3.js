"use strict";

if (require.main !== module) throw new Error("zmq-raft.js must be run directly from node");

const path = require('path');
const parseUrl = require('url').parse;

const program = require('commander')
    , debug = require('debug')('zmq-raft');

const pkg = require('./package.json');

const raft = require('.');

const { readConfig } = require('./lib/utils/config');

const opts = program.opts()
const start = async () => {
    try{
        const config = await readConfig("./example.json", "")
        config.id = "3";
      const peerId = config.id
          , peers = config.peers;
    
      var myPeer = peers.find(peer => peer.id === peerId);
    
      if (myPeer) {
        if (myPeer.pub) {
          setBroadcastUrl(config, myPeer.pub);
        }
        if (myPeer.www) {
          setWebmonitorUrl(config, myPeer.www);
        }
      }
    
      if (opts.bind) {
        setRouterBindUrl(config, opts.bind);
      }
      if (opts.pub) {
        setBroadcastUrl(config, opts.pub);
      }
      if (opts.www) {
        setWebmonitorUrl(config, opts.www);
      }
      const zmqRaft = await raft.server.builder.build(config)
      zmqRaft.on('error', (err) => {
        console.error("RAFT ERROR");
        console.error(err.stack);
        zmqRaft && zmqRaft.close().then(() => process.exit(1), () => process.exit(2));
      });
  
      process
      .on('SIGUSR2', () => {
        debug('terminating * SIGUSR2 *');
        shutdown();
      })
      .on('SIGTERM', () => {
        debug('terminating * SIGINT *');
        shutdown();
      })
      .on('SIGINT', () => {
        debug('terminating * SIGINT *');
        shutdown();
      })
      .on('SIGHUP', () => {
        debug('terminating * SIGHUP *');
        shutdown();
      })
      .on('uncaughtException', (err) => {
        debug('Caught unhandled exception: %s', err);
        if (err.stack) console.error(err.stack);
        shutdown();
      })
      .on('exit', () => {
        console.log('bye bye');
      });
  
      function shutdown() {
        if (!zmqRaft) process.exit();
        zmqRaft.close().then(() => process.exit(), () => process.exit());
        zmqRaft = undefined;
      }
  
      console.log('server listening at: %s', zmqRaft.url || zmqRaft.routerBindUrl);
    }
    catch(err){
        console.error("RAFT INIT ERROR");
        console.error(err.stack);
        process.exit();
    }
}


function setRouterBindUrl(config, bind) {
    config.router || (config.router = {});
    config.router.bind = bind;
}

function setBroadcastUrl(config, pub) {
    config.broadcast || (config.broadcast = {});
    config.broadcast.url = pub;
}

function setWebmonitorUrl(config, webmon) {
    config.webmonitor || (config.webmonitor = {})
    let url = parseUrl(webmon);
    if (url.hostname) {
      config.webmonitor.host = url.hostname;
    }
    if (url.port) {
      config.webmonitor.port = url.port >>>0;
    }
}

start()