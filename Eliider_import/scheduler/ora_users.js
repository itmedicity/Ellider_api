const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');
const { checkOraUserAlredyExcist } = require('./Func/FilterFunction');

const userUpload_job = schedule.scheduleJob('* 4 * * *', async () => {
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

    const userDataFromOra = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_users" table

    try {

        checkOraUserAlredyExcist((userDataFromMysql) => {
            const userId = userDataFromMysql.map((val) => val.us_code);

            //filter the user data not in mysql DB 
            let newUserArray = userDataFromOra?.filter((value) => {
                return userId.includes(value.US_CODE) === true ? null : value;
            })

            newUserArray && newUserArray?.map((value, index) => {
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
        })
    } catch (err) {
        console.log(err)
    }

    // console.log(userData)
    console.log(new Date())
})


module.exports = {
    userUpload_job
}
