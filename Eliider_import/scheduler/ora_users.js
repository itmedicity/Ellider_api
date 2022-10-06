const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');


const userUpload_job = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();

    // Get data From oracle database 
    const result = await conn.execute(
        `SELECT 
            us_code,
            usc_name,
            usc_alias,
            usc_status,
            bill_user,
            usc_default_mhcode
        FROM USERS`,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    const userData = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_users" table

    try {
        userData && userData.map((value, index) => {
            pool.query(
                `INSERT INTO ora_users
                    (us_code,
                    usc_name,
                    usc_alias,
                    usc_status,
                    bill_user,
                    usc_default_mhcode)
                VALUES(?,?,?,?,?,?)`,
                [
                    value.US_CODE,
                    value.USC_NAME,
                    value.USC_ALIAS,
                    value.USC_STATUS,
                    value.BILL_USER,
                    value.USC_DEFAULT_MHCODE,
                ],
                (error, result) => {
                    if (error) throw error;
                }
            )
        })
    } catch (err) {
        console.log(err)
    }

    console.log(userData)
    console.log(new Date())
})


module.exports = {
    userUpload_job
}
