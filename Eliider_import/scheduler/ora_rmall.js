const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')
const moment = require('moment');
const { oraConnection } = require('../../config/oracleConn');

const customDate = moment().format("DD-MMM-YYYY")

const getAdmittedIpNo = (callBack) => {
    pool.query('SELECT ip_no FROM ora_ipadmiss WHERE ipc_status IS NULL', [], (error, result, feild) => {
        if (error) {
            return error
        }
        return callBack(JSON.parse(JSON.stringify(result)));
    });
}

const rmallTableImport = schedule.scheduleJob('* * * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    const rmallTableData = (callBack) => {
        pool.query(
            `SELECT 
                rm_slno,
                ip_no,
                bd_code 
            FROM ora_rmall 
            WHERE rmd_occupdate BETWEEN TIMESTAMP(curdate()) AND sysdate()`,
            [],
            (error, result) => {
                if (error) {
                    throw error
                }
                return callBack(JSON.parse(JSON.stringify(result)));
            }
        )
    }

    try {
        //get the data from oracle
        let result = await oraConn.execute(
            `SELECT 
                R.RM_SLNO,
                R.IP_NO,
                R.BD_CODE,
                R.RMD_OCCUPDATE,
                R.RMC_OCCUPTYPE,
                R.RMD_RELESEDATE,
                R.RMC_RELESETYPE,
                R.RMC_OCCUPBY,
                R.RMC_RLNO,
                R.US_CODE,
                R.RMN_NO,
                R.RMC_MHCODE,
                R.RMC_RENTSHARETYPE,
                A.RC_CODE
            FROM RMALL R INNER JOIN IPADMISS A ON A.IP_NO = R.IP_NO
            WHERE 
                R.RMD_OCCUPDATE >= to_date(To_char(trunc(SYSDATE),'dd/mon/yyyy')||' 00:00:00','dd/mm/yyyy hh24:mi:ss') 
            AND
                R.RMD_OCCUPDATE <= to_date(To_char(trunc(SYSDATE),'dd/mon/yyyy')||' 23:59:59','dd/mon/yyyy hh24:mi:ss')`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        const rmallData = await result.resultSet?.getRows();

        //REMOVE THE TYPE TWO PATIENT
        getAdmittedIpNo((ipNumber) => {

            //REMOVE THE TYPE 2 IP NUMBER
            const ipNo = ipNumber?.map((val) => val.ip_no)
            const actualRmallData = rmallData?.filter(val => ipNo.includes(val.IP_NO) === true ? val : null)


            rmallTableData((rmallDetl) => {
                /***
                 * rmallDetl is data from mysql 
                 * then filter with incoming data from Oracle ( actualRmallData )
                 * for avoiding the duplicates
                 */

                const oraRmallAct = actualRmallData?.map((value) => {
                    const a = rmallDetl.find((val) => val.ip_no === value.IP_NO && val.rm_slno === value.RM_SLNO && val.bd_code === value.BD_CODE)
                    return a === undefined ? value : null;
                }).filter((val) => val !== null)

                //insert into the mysql 
                oraRmallAct && oraRmallAct?.map((value) => {
                    pool.query(
                        `INSERT INTO ora_rmall
                            (
                                rm_slno,
                                ip_no,
                                bd_code,
                                rc_code,
                                rmd_occupdate,
                                rmc_occuptype,
                                rmd_relesedate,
                                rmd_relesetype,
                                rmc_occupby,
                                rmc_rlno,
                                us_code,
                                rmn_no,
                                rmc_mhcode,
                                rmc_rentsharetype
                            )
                        VALUES
                        (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [
                            value.RM_SLNO,
                            value.IP_NO,
                            value.BD_CODE,
                            value.RC_CODE,
                            moment(value.RMD_OCCUPDATE).format('YYYY-MM-DD HH:mm:ss'),
                            value.RMC_OCCUPTYPE,
                            moment(value.RMD_RELESEDATE).isValid() ? moment(value.RMD_RELESEDATE).format('YYYY-MM-DD HH:mm:ss') : "0000-00-00 00:00:00",
                            value.RMC_RELESETYPE,
                            value.RMC_OCCUPBY,
                            value.RMC_RLNO,
                            value.US_CODE,
                            value.RMN_NO,
                            value.RMC_MHCODE,
                            value.RMC_RENTSHARETYPE,
                            value.PT_NO
                        ],
                        (error, result) => {
                            if (error) throw error;
                        }
                    )
                })

                //updation into the IPADMISS TABLE
                const ipadmissTableUpdation = async (data) => {
                    let ipData = data?.map((val) => {
                        return {
                            ip_no: val.IP_NO,
                            bd_code: val.BD_CODE,
                            rc_code: val.RC_CODE
                        }
                    })
                    ipData?.map((data) => {
                        pool.query(
                            `UPDATE ora_ipadmiss 
                                SET bd_code = ?,
                                    rc_code = ?
                            WHERE ip_no = ?`,
                            [
                                data.bd_code,
                                data.rc_code,
                                data.ip_no
                            ],
                            (error, result) => {
                                if (error) throw error;
                            }
                        )
                    })

                }

                ipadmissTableUpdation(oraRmallAct)
            })
        })

    } catch (err) {
        console.log(err)
    } finally {
        console.log('patient-completed rmall')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }
})

module.exports = {
    rmallTableImport
}
