"use strict";

if (require.main !== module) throw new Error("zr-config.js must be run directly from node");

const url = require('url')
    , assert = require('assert');

const program = require('commander');

const { decode: decodeMsgPack } = require('msgpack-lite');

const pkg = require('./package.json');

const raft = require('./');

const { readConfig } = require('./lib/utils/config');

const { client: { ZmqRaftClient }
      , common: { constants: { RE_STATUS_SNAPSHOT
                             , SERVER_ELECTION_GRACE_MS }
                , LogEntry: { LOG_ENTRY_TYPE_CONFIG
                            , readers: { readTypeOf
                                       , readDataOf } } }
      , utils: { id: { genIdent, isIdent }
               , helpers: { parsePeers } }
      } = raft;

const lookup = require('./lib/utils/dns_lookup').hostsToZmqUrls;

const opts = program.opts()
var mongoObjectId = function () {
  var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
      return (Math.random() * 16 | 0).toString(16);
  }).toLowerCase();
};
const randomData = {
    id: "asdasdgasdgasdgasdgasdgasdg",
    from: "asdfgasdgasdgasdgasdg",
    type: "update",
    query: "asdfasdfasdf asdfasdgasdg asdgasdg asdg asdg asdg asdg asdg asdg asdg asdg asfhasdjkvasdjklghbiejgbruigvbkascjnv sfksd fjibweg uiopedcvbjQERIPGBPIQECV",
    previousHash: "asdgfvhbasdghbjklasdfhjklasdfasfgjnklasc jioweqfho",
    currentHash: "qhioasdcujnqwefhoqwefpnowdcopnwechowedcv",
    nonce: getRandomInt(10000000)
};
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
const mongoose = require("mongoose")
const GenericModelSchema = new mongoose.Schema({
  data:{}
})
const connections = []
const models = []
const peers = require("./example.json").peers
for(const peer of peers){
  const conn = mongoose.createConnection(peer.mongoUri)
  const model = conn.model("generic", GenericModelSchema)
  models.push(model)
}
const append = async () => {
    let config = await readConfig("./example.json", "")
    const urls = Array.from(parsePeers(config.peers).values())
    const client = new ZmqRaftClient(urls, {secret: config.secret})
    config = await client.requestConfig()
    console.time("request")
    const promises = []   
    for(let i = 0; i < 1000 ; i+=1){
      promises.push(client.requestUpdate(mongoObjectId(), Buffer.from(JSON.stringify(randomData))))
      for(const model of models){
        const document = new model({
          data: randomData
        })
      promises.push(document.save())
      }
    }
    await Promise.all(promises)
    console.timeEnd("request")
    process.exit()
}


function parsePeerUrl(peer) {
    var id;
    const {protocol, host, pathname} = url.parse(peer);
    if (pathname) {
      id = decodeURIComponent(pathname.substring(1));
      assert(id.length !== 0, 'peer id must not be empty');
    }
    peer = url.format({protocol, host, slashes:true});
    if (id === undefined) id = peer;
    return {id, url: peer};
  }
  
  function parsePeerUrls(peers, currentPeers) {
    return parsePeers(peers.split(/\s*,\s*/).map(parsePeerUrl), currentPeers);
  }
  
  function configIsSame(oldcfg, newcfg) {
    if (oldcfg.size !== newcfg.size) return false;
    return Array.from(newcfg).every(([id, url]) => {
      return oldcfg.get(id) === url;
    });
  }
  
  function getIdent() {
    var id = opts.ident || genIdent();
    if (!isIdent(id)) {
      exitError(3, "invalid ident format");
    }
    return id;
  }
  
  function objectToAry(obj) {
    return Object.keys(obj).map(key => [key, obj[key]]);
  }
  
  function formatPeer(id, url) {
    if (id === url) return id;
    else return url + '/' + encodeURIComponent(id);
  }
  
  function showConfig(cfg, leaderId, label, oldcfg) {
    console.log("%s:", label);
    cfg.forEach((url, id) => {
      var peer = formatPeer(id, url);
      if (oldcfg) {
        if (!oldcfg.has(id)) peer += ' (added)';
      }
      else if (id === leaderId) {
        peer += ' (leader)';
      }
      console.log("  %s", peer);
    });
    if (oldcfg) {
      oldcfg.forEach((url, id) => {
        if (!cfg.has(id)) {
          console.log("  %s (removed)", formatPeer(id, url));
        }
      });
    }
    console.log('');
  }
  
  function waitForConfig(index, client) {
    var config, configIndex;
  
    const next = () => client.delay(SERVER_ELECTION_GRACE_MS)
    .then(() => client.requestEntries(index, (status, entries, lastIndex) => {
      if (status !== RE_STATUS_SNAPSHOT) {
        const idx = entries.findIndex(entry => readTypeOf(entry) === LOG_ENTRY_TYPE_CONFIG);
        if (idx !== -1) {
          config = decodeMsgPack(readDataOf(entries[idx]));
          configIndex = lastIndex - entries.length + 1 + idx;
          return false;
        }
      }
    }))
    .then(result => result ? next() : {config, configIndex});
  
    return next();
  }
  
append()