const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');

const nurstationJob = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();

    // Get data From oracle database "OUTLET" table
    const result = await conn.execute(
        `SELECT 
            ns_code,
            nsc_desc,
            nsc_alias,
            ou_code,
            nsc_status,
            nsc_mhcode,
            us_code
        FROM NURSTATION`,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    const userData = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_outlet" table

    try {
        userData && userData.map((value, index) => {
            console.log(value)
            pool.query(
                `INSERT INTO ora_nurstation
                    (ns_code,
                    nsc_desc,
                    nsc_alias,
                    ou_code,
                    nsc_status,
                    nsc_mhcode,
                    us_code)
                VALUES(?,?,?,?,?,?,?)`,
                [
                    value.NS_CODE,
                    value.NSC_DESC,
                    value.NSC_ALIAS,
                    value.OU_CODE,
                    value.NSC_STATUS,
                    value.NSC_MHCODE,
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
    nurstationJob
}
