const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');

const roomMasterJob = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();

    // Get data From oracle database "OUTLET" table
    const result = await conn.execute(
        `SELECT 
            rm_code,
            rmc_desc,
            rmc_alias,
            ns_code,
            rmc_status,
            rmd_eddate,
            rmc_mhcode,
            us_code
        FROM ROOMMASTER`,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    const userData = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_outlet" table

    try {
        userData && userData.map((value, index) => {
            console.log(value)
            pool.query(
                `INSERT INTO ora_roommaster
                    (rm_code,
                    rmc_desc,
                    rmc_alias,
                    ns_code,
                    rmc_status,
                    rmd_eddate,
                    rmc_mhcode,
                    us_code)
                VALUES(?,?,?,?,?,?,?,?)`,
                [
                    value.RM_CODE,
                    value.RMC_DESC,
                    value.RMC_ALIAS,
                    value.NS_CODE,
                    value.RMC_STATUS,
                    value.RMD_EDDATE,
                    value.RMC_MHCODE,
                    value.US_CODE
                ],
                (error, result) => {
                    if (error) throw error;
                }
            )
        })
    } catch (err) {
        console.log(err)
    }

    // console.log(userData)
    console.log(new Date())
})


module.exports = {
    roomMasterJob
}
