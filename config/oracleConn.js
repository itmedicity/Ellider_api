const oracledb = require('oracledb');

const oraConnection = async () => {
    return await oracledb.getConnection({
        user: process.env.ORA_USER,
        password: process.env.ORAC_PASS,
        connectionString: process.env.ORA_CONN_STRING
    });
}

module.exports = {
    oraConnection
}