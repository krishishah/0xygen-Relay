# 0x-relay
Decentralised Ethereum Token Relay


Credit to this tutorial: http://mherman.org/blog/2016/11/05/developing-a-restful-api-with-node-and-typescript/#.WkONI7SZ3OS for boilerplate setup



Database Setup

brew install postgres
initdb /usr/local/var/postgres
createuser --pwprompt <username>
createdb -O<dbownerusername> -Eutf8 <dbname>
psql -U <dbownerusername>  -W <dbname>

credit to this tutorial: https://www.tunnelsup.com/setting-up-postgres-on-mac-osx/
https://www.codementor.io/engineerapart/getting-started-with-postgresql-on-mac-osx-are8jcopb