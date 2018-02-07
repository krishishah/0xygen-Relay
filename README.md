# 0x-relay 

## Decentralised Ethereum Token Relay

### Development Environment Setup

Install [Node.js and NPM](https://nodejs.org/en/download/)

- on OSX use [homebrew](http://brew.sh) `brew install node`


```bash
# install the dependencies
npm install
```

### Other NPM tasks

After running `npm install` once, you can:

#### Build the app

```sh
npm run build
```

#### Run the app once

When running the application, you must have the required environment variables set (if you don't, it's OK - application startup with fail and notify you of the values that you need to set)

```sh
npm start
```

#### Run the linter

Tailor the `tslint.json` to your likings

```sh
npm run lint
```


### Database Setup

```
brew install postgres
initdb /usr/local/var/postgres
createuser --pwprompt <username>
createdb -O<dbownerusername> -Eutf8 <dbname>
psql -U <dbownerusername>  -W <dbname>
```


### Third Party Utilities

- **Dependency Injection** done with the nice framework from [TypeDI](https://github.com/pleerock/typedi).
- **Simplified Database Query** with the ORM [TypeORM](https://github.com/typeorm/typeorm).


### Credit

credit to the following tutorials and open-source repos:
* https://www.tunnelsup.com/setting-up-postgres-on-mac-osx/
* https://www.codementor.io/engineerapart/getting-started-with-postgresql-on-mac-osx-are8jcopb
* http://mherman.org/blog/2016/11/05/developing-a-restful-api-with-node-and-typescript/#.WkONI7SZ3OS
* https://github.com/w3tecch/express-typescript-boilerplate
* https://circleci.com/docs/2.0/postgres-config/