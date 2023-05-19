DEBUG=* bin/zmq-raft.js -c config/example.hjson \
  --bind "tcp://*:8347" \
  --pub tcp://127.0.0.1:8348 \
  --www http://localhost:8350 4