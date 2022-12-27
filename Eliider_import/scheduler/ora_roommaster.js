const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');
const { checkOrarRoomMasterAlredyExcist } = require('./Func/FilterFunction');

const roomMasterJob = schedule.scheduleJob('0 */6 * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    try {

        // Get data From oracle database "OUTLET" table
        const result = await oraConn.execute(
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

        const roomMasterFromOra = await result.resultSet?.getRows();

        //Inser to My sql Database "ora_outlet" table
        checkOrarRoomMasterAlredyExcist((roomMasterFromMysql) => {
            const roomCode = roomMasterFromMysql.map((val) => val.rm_code);

            let newUserArray = roomMasterFromOra?.filter((value) => {
                return roomCode.includes(value.RM_CODE) === true ? null : value;
            })

            console.log(newUserArray)

            // console.log(newUserArray)

            newUserArray && newUserArray.map((value, index) => {
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
        })

    } catch (err) {
        console.log(err)
    } finally {
        console.log('roommaster-completed')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }
})

module.exports = {
    roomMasterJob
}
