const oracledb = require('oracledb');
const pool = require('../../config/database')
const moment = require('moment');

var CronJob = require('cron').CronJob;
const { oraConnection } = require('../../config/oracleConn');



const job = new CronJob('* 2-23 * * *', async () => {
    console.log('You will see this message every minits');
    const customDate = moment().format("DD-MMM-YYYY")
    const customDateMysql = moment().format("YYYY-MM-DD")

    console.log(customDate)
    console.log(customDateMysql)

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();


    try {

        const PatientIpNumber = (callBack) => {
            pool.query(
                `SELECT ip_no FROM ora_ipadmiss WHERE date(ipd_date) = ?`,
                [customDateMysql],
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
            WHERE TRUNC(IPD_DATE) = TRUNC(SYSDATE) 
            AND IPC_PTFLAG = 'N' 
            AND IPC_STATUS IS NULL 
            ORDER BY ip_no DESC`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        // console.log(customDate)
        const ipAdmissionData = await result.resultSet?.getRows();

        const a = ipAdmissionData?.map((val) => {
            return {
                "ip": val.IP_NO,
                "date": moment(val.IPD_DATE).format('YYYY-MM-DD HH:mm:ss')
            }
        })
        console.log(a)

        // PatientIpNumber((patientIpNo) => {
        //     // console.log(patientIpNo)
        //     const patIpNumber = patientIpNo?.map(val => val.ip_no);
        //     const ActualIpAdmission = ipAdmissionData && ipAdmissionData.filter(val => patIpNumber.includes(val.IP_NO) === true ? null : val.IP_NO)
        //     // console.log(ActualIpAdmission)
        //     ActualIpAdmission && ActualIpAdmission.map((value, index) => {
        //         pool.query(
        //             `INSERT INTO ora_ipadmiss
        //                 (ip_no,
        //                 pt_no,
        //                 ipd_date,
        //                 ptc_ptname,
        //                 ptc_type,
        //                 ptc_sex,
        //                 ptd_dob,
        //                 sa_code,
        //                 ptc_loadd1,
        //                 ptc_loadd2,
        //                 rc_code,
        //                 bd_code,
        //                 do_code,
        //                 rs_code,
        //                 ipd_disc,
        //                 ipc_status,
        //                 dmc_cacr,
        //                 dmc_slno,
        //                 dmd_date,
        //                 us_code,
        //                 cu_code,
        //                 pt_code,
        //                 dis_uscode,
        //                 ptc_mobile,
        //                 ipc_ptflag,
        //                 ipc_mhcode,
        //                 ipc_admitdocode,
        //                 st_code,
        //                 ipc_admittypcode,
        //                 ipc_diagnosis,
        //                 rl_code,
        //                 ipc_ipbillremark,
        //                 ipc_blremarkuser,
        //                 ipc_fathername,
        //                 rg_code,
        //                 ipc_mlc,
        //                 ms_code,
        //                 ipc_rtcode)
        //             VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        //             [
        //                 value.IP_NO,
        //                 value.PT_NO,
        //                 value.IPD_DATE,
        //                 value.PTC_PTNAME,
        //                 value.PTC_TYPE,
        //                 value.PTC_SEX,
        //                 value.PTD_DOB,
        //                 value.SA_CODE,
        //                 value.PTC_LOADD1,
        //                 value.PTC_LOADD2,
        //                 value.RC_CODE,
        //                 value.BD_CODE,
        //                 value.DO_CODE,
        //                 value.RS_CODE,
        //                 value.IPD_DISC,
        //                 value.IPC_STATUS,
        //                 value.DMC_CACR,
        //                 value.DMC_SLNO,
        //                 value.DMD_DATE,
        //                 value.US_CODE,
        //                 value.CU_CODE,
        //                 value.PT_CODE,
        //                 value.DIS_USCODE,
        //                 value.PTC_MOBILE,
        //                 value.IPC_PTFLAG,
        //                 value.IPC_MHCODE,
        //                 value.IPC_ADMITDOCODE,
        //                 value.ST_CODE,
        //                 value.IPC_ADMITTYPCODE,
        //                 value.IPC_DIAGNOSIS,
        //                 value.RL_CODE,
        //                 value.IPC_IPBILLREMARK,
        //                 value.IPC_BLREMARKUSER,
        //                 value.IPC_FATHERNAME,
        //                 value.RG_CODE,
        //                 value.IPC_MLC,
        //                 value.MS_CODE,
        //                 value.IPC_RTCODE
        //             ],
        //             (error, result) => {
        //                 if (error) throw error;
        //             }
        //         )
        //     })
        // })

    } catch (err) {
        console.log(err)
    } finally {
        console.log('ipadmiss-completed')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }

},
    null,
    true,
    'Asia/Kolkata'
);

module.exports = {
    job
}