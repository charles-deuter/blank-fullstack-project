### blank-express-project
This is a blank express project, it has minimal functionality, but includes some minimal endpoints and tests for functionality

#### Install

```console
npm install
```

#### Start server

```console
npm start
```

#### Running tests

# Run all tests
```console
npm test
```

# Run one test
```console
npm test -- path/to/test.spec.ts
```

#### DB

# generate migrations
```console
npm run db:generate
```

# run migrations against db
Set ENV variables in your .env file
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=local
DATABASE_PASSWORD=<password here>
```
run command
```console
npm run db:migrate
```

#### Linting

# check formatting without writing
```console
npm run format:check
```

# fix formatting errors
```console
npm run format
```
