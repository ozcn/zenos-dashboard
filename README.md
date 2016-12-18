# zenos-dashboard

## Deploy to Heroku

```
#.git/config
[remote "heroku"]
	url = https://git.heroku.com/zenos.git
	fetch = +refs/heads/*:refs/remotes/heroku/*
```

```
git push heroku `git subtree split --prefix colu_api master`:master --force
```

## How to setup dev env

Install Node.js `.node-version`

```
npm install
npm install -g node-dev
```

.env を作成して環境変数を設定する

```
cp colu_api/.env-sample colu_api/.env
```

開発サーバーを起動する

```
node-dev index.js
```
