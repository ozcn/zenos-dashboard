# zenos-dashboard

## Deploy

git subtree push --prefix colu_api/ heroku master


## How to setup dev env

Install Node.js v4.6.0

```
npm install
npm install -g node-dev
```

```
export COLU_SDK_NETWORK='testnet' # // 'testnet' or 'mainnet' (default = 'mainnet')
export COLU_SDK_PRIVATE_SEED=e9ecf6413f89841a1a1f1821f151560da80685a74885c970e46fea3810baa2ea #// Private seed for Base58 private key (private seed | private seed WIF)
export COLU_SDK_RPC_SERVER_HTTP_PORT=8081 # // HTTP port (default = 80)
```

colu server を起動する。

```
./node_modules/.bin/colu &
```

開発サーバーを起動する。

```
node-dev index.js
```
