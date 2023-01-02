const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')
const moment = require('moment');

const { oraConnection } = require('../../config/oracleConn');

const customDate = moment().format("DD-MMM-YYYY")
const customDateMysql = moment().format("YYYY-MM-DD")

const ipAdmissJob = schedule.scheduleJob('*/11 * * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    try {

        const PatientIpNumber = (callBack) => {
            pool.query(
                `SELECT 
                    ip_no 
                FROM ora_ipadmiss 
                WHERE ipd_date BETWEEN TIMESTAMP(curdate()) AND sysdate()`,
                [],
                (error, result) => {
                    if (error) {
                        throw error
                    }
                    return callBack(JSON.parse(JSON.stringify(result)));
                }
            )
        }

        //get ip admission data from oracle
        const result = await oraConn.execute(
            `SELECT 
                ip_no,
                pt_no,
                ipd_date,
                ptc_ptname,
                ptc_type,
                ptc_sex,
                ptd_dob,
                sa_code,
                ptc_loadd1,
                ptc_loadd2,
                rc_code,
                bd_code,
                do_code,
                rs_code,
                ipd_disc,
                ipc_status,
                dmc_cacr,
                dmc_slno,
                dmd_date,
                us_code,
                cu_code,
                pt_code,
                dis_uscode,
                ptc_mobile,
                ipc_ptflag,
                ipc_mhcode,
                ipc_admitdocode,
                st_code,
                ipc_admittypcode,
                ipc_diagnosis,
                rl_code,
                ipc_ipbillremark,
                ipc_blremarkuser,
                ipc_fathername,
                rg_code,
                ipc_mlc,
                ms_code,
                ipc_rtcode
            FROM IPADMISS 
            WHERE  IPD_DATE >= to_date(To_char(trunc(SYSDATE),'dd/mon/yyyy')||' 00:00:00','dd/mm/yyyy hh24:mi:ss') and
                IPD_DATE  <= to_date(To_char(trunc(SYSDATE),'dd/mon/yyyy')||' 23:59:59','dd/mon/yyyy hh24:mi:ss')
            AND IPC_PTFLAG = 'N' AND IPC_STATUS IS NULL`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        // console.log(customDate)
        const ipAdmissionData = await result.resultSet?.getRows();
        // console.log(ipAdmissionData)

        PatientIpNumber((patientIpNo) => {
            // console.log(patientIpNo)
            const patIpNumber = patientIpNo?.map(val => val.ip_no);
            const ActualIpAdmission = ipAdmissionData && ipAdmissionData.filter(val => patIpNumber.includes(val.IP_NO) === true ? null : val.IP_NO)
            // console.log(ActualIpAdmission)
            ActualIpAdmission && ActualIpAdmission.map((value, index) => {
                pool.query(
                    `INSERT INTO ora_ipadmiss
                        (ip_no,
                        pt_no,
                        ipd_date,
                        ptc_ptname,
                        ptc_type,
                        ptc_sex,
                        ptd_dob,
                        sa_code,
                        ptc_loadd1,
                        ptc_loadd2,
                        rc_code,
                        bd_code,
                        do_code,
                        rs_code,
                        ipd_disc,
                        ipc_status,
                        dmc_cacr,
                        dmc_slno,
                        dmd_date,
                        us_code,
                        cu_code,
                        pt_code,
                        dis_uscode,
                        ptc_mobile,
                        ipc_ptflag,
                        ipc_mhcode,
                        ipc_admitdocode,
                        st_code,
                        ipc_admittypcode,
                        ipc_diagnosis,
                        rl_code,
                        ipc_ipbillremark,
                        ipc_blremarkuser,
                        ipc_fathername,
                        rg_code,
                        ipc_mlc,
                        ms_code,
                        ipc_rtcode)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        value.IP_NO,
                        value.PT_NO,
                        moment(value.IPD_DATE).format('YYYY-MM-DD HH:mm:ss'),
                        value.PTC_PTNAME,
                        value.PTC_TYPE,
                        value.PTC_SEX,
                        moment(value.PTD_DOB).format('YYYY-MM-DD'),
                        value.SA_CODE,
                        value.PTC_LOADD1,
                        value.PTC_LOADD2,
                        value.RC_CODE,
                        value.BD_CODE,
                        value.DO_CODE,
                        value.RS_CODE,
                        moment(value.IPD_DISC).isValid() ? moment(value.IPD_DISC).format('YYYY-MM-DD HH:mm:ss') : "0000-00-00 00:00:00",
                        value.IPC_STATUS,
                        value.DMC_CACR,
                        value.DMC_SLNO,
                        moment(value.DMD_DATE).isValid() ? moment(value.DMD_DATE).format('YYYY-MM-DD HH:mm:ss') : "0000-00-00 00:00:00",
                        value.US_CODE,
                        value.CU_CODE,
                        value.PT_CODE,
                        value.DIS_USCODE,
                        value.PTC_MOBILE,
                        value.IPC_PTFLAG,
                        value.IPC_MHCODE,
                        value.IPC_ADMITDOCODE,
                        value.ST_CODE,
                        value.IPC_ADMITTYPCODE,
                        value.IPC_DIAGNOSIS,
                        value.RL_CODE,
                        value.IPC_IPBILLREMARK,
                        value.IPC_BLREMARKUSER,
                        value.IPC_FATHERNAME,
                        value.RG_CODE,
                        value.IPC_MLC,
                        value.MS_CODE,
                        value.IPC_RTCODE
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
        console.log('ipadmiss-completed')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }
})
module.exports = {
    ipAdmissJob
}
