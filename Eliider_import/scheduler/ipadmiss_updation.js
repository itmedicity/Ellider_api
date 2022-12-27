const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')
const moment = require('moment');

const { oraConnection } = require('../../config/oracleConn');

const ipadmissUpdationBasedOnDischarge = schedule.scheduleJob('*/3 * * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    try {

        // Get adischarge bill details from oracle database
        const ipAdmissTableDta = await oraConn.execute(
            `SELECT 
                PTC_TYPE,
                IPD_DISC,
                DMD_DATE,
                CU_CODE,
                DIS_USCODE,
                IPC_DISSUMSTATUS,
                IP_NO
            FROM IPADMISS 
            WHERE TRUNC(IPD_DISC)  = TRUNC(SYSDATE) AND IPC_PTFLAG = 'N'`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        const disBillDetl = await ipAdmissTableDta.resultSet?.getRows();

        disBillDetl?.map((val) => {
            pool.query(
                `UPDATE 
                    ora_ipadmiss 
                SET 
                    ptc_type = ?,
                    ipd_disc = ?,
                    dmd_date = ?,
                    cu_code = ?,
                    dis_uscode = ?,
                    ipc_dissumstatus = ?
                WHERE ip_no = ?`,
                [
                    val.PTC_TYPE,
                    moment(val.IPD_DISC).isValid() ? moment(val.IPD_DISC).format('YYYY-MM-DD HH:mm:ss') : "0000-00-00 00:00:00",
                    moment(val.DMD_DATE).isValid() ? moment(val.DMD_DATE).format('YYYY-MM-DD HH:mm:ss') : "0000-00-00 00:00:00",
                    val.CU_CODE,
                    val.DIS_USCODE,
                    val.IPC_DISSUMSTATUS,
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
        console.log('ipadmission table 3 minits ')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }

})

module.exports = {
    ipadmissUpdationBasedOnDischarge
}