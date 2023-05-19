export DEBUG=*
node start-raft.js &
node start-raft-2.js &
node start-raft-3.js &
node start-raft-4.js &
node start-raft-5.js

# export DEBUG=*
# bin/zmq-raft.js -c config/example.hjson 1 &
# bin/zmq-raft.js -c config/example.hjson 2 &
# bin/zmq-raft.js -c config/example.hjson 3 &