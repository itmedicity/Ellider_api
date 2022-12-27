const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');
const { checkOrarRoomCategoryAlredyExcist } = require('./Func/FilterFunction');

const roomCategoryJob = schedule.scheduleJob('0 */6 * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    try {

        // Get data From oracle database "OUTLET" table
        const result = await oraConn.execute(
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

        const roomCategoryFromOra = await result.resultSet?.getRows();

        checkOrarRoomCategoryAlredyExcist((roomCategoryFromMysql) => {

            const roomCategory = roomCategoryFromMysql.map((val) => val.rc_code);

            let newArray = roomCategoryFromOra?.filter((value) => {
                return roomCategory.includes(value.RC_CODE) === true ? null : value;
            })

            newArray && newArray.map((value, index) => {
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
        })

    } catch (err) {
        console.log(err)
    } finally {
        console.log('roomcategy-completed')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }
})


module.exports = {
    roomCategoryJob
}
