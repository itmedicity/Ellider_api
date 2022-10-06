const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');

const outletUploadJob = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();

    // Get data From oracle database "OUTLET" table
    const result = await conn.execute(
        `SELECT
            ou_code,
            ouc_desc,
            ouc_alias,
            ouc_status,
            ouc_stock,
            ouc_outlet,
            ouc_type,
            ouc_mhcode,
            us_code
        FROM  outlet `,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    const userData = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_outlet" table

    try {
        userData && userData.map((value, index) => {
            // console.log(value)
            pool.query(
                `INSERT INTO ora_outlet
                    (ou_code,
                    ouc_desc,
                    ouc_alias,
                    ouc_status,
                    ouc_stock,
                    ouc_outlet,
                    ouc_type,
                    ouc_mhcode,
                    us_code)
                VALUES(?,?,?,?,?,?,?,?,?)`,
                [
                    value.OU_CODE,
                    value.OUC_DESC,
                    value.OUC_ALIAS,
                    value.OUC_STATUS,
                    value.OUC_STOCK,
                    value.OUC_OUTLET,
                    value.OUC_TYPE,
                    value.OUC_MHCODE,
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
    outletUploadJob
}
