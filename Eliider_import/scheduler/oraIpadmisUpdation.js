const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')
const moment = require('moment');

const { oraConnection } = require('../../config/oracleConn');

const ipadmissUpdation = schedule.scheduleJob('*/30 * * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    try {

        // Get adischarge bill details from oracle database
        const disBillData = await oraConn.execute(
            ` SELECT 
                    IP_NO,
                    DMD_DATE,
                    CU_CODE
                FROM DISBILLMAST 
                WHERE 
                            DMD_DATE  >= to_date(To_char(trunc(SYSDATE),'dd/mon/yyyy')||' 00:00:00','dd/mm/yyyy hh24:mi:ss') and
                            DMD_DATE  <= to_date(To_char(trunc(SYSDATE),'dd/mon/yyyy')||' 23:59:59','dd/mon/yyyy hh24:mi:ss')
                    AND DMC_PTFLAG = 'N' 
                    AND DMC_CANCEL IS NULL`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        const disBillDetl = await disBillData.resultSet?.getRows();

        disBillDetl?.map((val) => {
            pool.query(
                `UPDATE 
                    ora_ipadmiss 
                SET 
                    ipc_status = 'Y',
                    dmd_date = ?,
                    cu_code = ?
                WHERE ip_no = ?`,
                [
                    moment(val.DMD_DATE).isValid() ? moment(val.DMD_DATE).format('YYYY-MM-DD HH:mm:ss') : "0000-00-00 00:00:00",
                    val.CU_CODE,
                    val.IP_NO
                ],
                (error, result) => {
                    if (error) {
                        throw error
                    }
                    // return callBack(JSON.parse(JSON.stringify(result)));
                }
            )
        })

    } catch (err) {
        console.log(err)
    } finally {
        console.log('dischareg ')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }

})

module.exports = {
    ipadmissUpdation
}