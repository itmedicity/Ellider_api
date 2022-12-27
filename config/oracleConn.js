const oracledb = require('oracledb');

const oraConnection = async () => {
    return await oracledb.createPool({
        user: process.env.ORA_USER,
        password: process.env.ORAC_PASS,
        connectString: process.env.ORA_CONN_STRING,
        poolMin: 1,
        poolMax: 4,
    });
}

module.exports = {
    oraConnection
}