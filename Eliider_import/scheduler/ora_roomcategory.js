const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');

const roomCategoryJob = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();

    // Get data From oracle database "OUTLET" table
    const result = await conn.execute(
        `SELECT 
            rc_code,
            rcc_desc,
            rcc_alias,
            rcn_order,
            rcc_status,
            us_code,
            rcd_eddate,
            rcc_mhcode
        FROM ROOMCATEGORY`,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    const userData = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_outlet" table

    try {
        userData && userData.map((value, index) => {
            console.log(value)
            pool.query(
                `INSERT INTO ora_roomcategory
                    (rc_code,
                    rcc_desc,
                    rcc_alias,
                    rcn_order,
                    rcc_status,
                    us_code,
                    rcd_eddate,
                    rcc_mhcode)
                VALUES(?,?,?,?,?,?,?,?)`,
                [
                    value.RC_CODE,
                    value.RCC_DESC,
                    value.RCC_ALIAS,
                    value.RCN_ORDER,
                    value.RCC_STATUS,
                    value.US_CODE,
                    value.RCD_EDDATE,
                    value.RCC_MHCODE
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
    roomCategoryJob
}
