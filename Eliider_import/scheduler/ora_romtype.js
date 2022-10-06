const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');

const roomTypeJob = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();

    // Get data From oracle database "OUTLET" table
    const result = await conn.execute(
        `SELECT  
            rt_code,
            rtc_desc,
            rtc_alias,
            rc_code,
            rtc_status,
            us_code
        FROM ROOMTYPE`,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    const userData = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_outlet" table

    try {
        userData && userData.map((value, index) => {
            console.log(value)
            pool.query(
                `INSERT INTO ora_roomtype
                    (rt_code,
                    rtc_desc,
                    rtc_alias,
                    rc_code,
                    rtc_status,
                    us_code)
                VALUES(?,?,?,?,?,?)`,
                [
                    value.RT_CODE,
                    value.RTC_DESC,
                    value.RTC_ALIAS,
                    value.RC_CODE,
                    value.RTC_STATUS,
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
    roomTypeJob
}
