# 0xygen

## Decentralised Ethereum Token Relayer

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

#### Debian/Ubuntu

In Ubuntu/Debian based:

Update and Install PostgreSQL 9.5:
    
    sudo apt-get update
    sudo apt-get install postgresql-9.5

By default, the ``postgres`` user has no password and can hence only connect
if ran by the ``postgres`` system user. The following command will assign it:

    sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
    sudo -u postgres psql -c "CREATE DATABASE testdb;"
    sudo -u postgres psql -c "ALTER DATABASE testdb SET TIMEZONE TO 'UTC';"

Start

     sudo service postgresql start

#### OS X

Assuming [brew](http://brew.sh/) is installed:

    brew update
    brew install postgresql

Create the initial database:

    initdb /usr/local/var/postgres

Start the database server:

    pg_ctl -D /usr/local/var/postgres -l logfile start

Create the user 'postgres' with super user privileges:

    createuser --superuser=postgres

Create the test data base:

    createdb --owner=postgres testdb

To stop the postgres server:  

    pg_ctl -D /usr/local/var/postgres stop


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
