const { ConnectionPool } = require('mssql')
const POOLS = {}

async function createPool(config) {
    let name = config.database
    //if (getPool(config)) {
    //    return Promise.reject(new Error('Pool with this name already exists'))
    //}
    return (new ConnectionPool(config)).connect().then((pool) => {
        return POOLS[name] = pool
    })
}

async function closePool(config) {
    let name = config.database
    const pool = getPool(config)
    if (pool) {
        delete POOLS[name]
        return pool.close()
    }
    return Promise.resolve()
}

async function getPool(config) {
    let name = config.database
    if (POOLS.hasOwnProperty(name)) {
        return POOLS[name]
    } else {
        return createPool(config)
    }
}

module.exports = {
  closePool,
  //createPool,
  getPool
}