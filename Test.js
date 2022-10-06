const { oraConnection } = require('./config/oracleConn');
const schedule = require('node-schedule');
const oracledb = require('oracledb');


const testjob = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();
    console.log('hai')

    console.log(conn)


    // const result = await conn.execute(
    //     `SELECT * FROM DEPARTMENT WHERE DP_CODE = 'P003'`,
    //     [],
    //     { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    // )

    // const rsult = await result.resultSet?.getRows()
    // console.log(rsult)
    // console.log(new Date())
})


module.exports = {
    testjob
}