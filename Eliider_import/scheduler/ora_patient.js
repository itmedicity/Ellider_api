const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')
const moment = require('moment');
const { oraConnection } = require('../../config/oracleConn');

const customDate = moment().format("DD-MMM-YYYY")

const patientImportJob = schedule.scheduleJob('* * * * *', async () => {
    const conn = await oraConnection();

    //SELECT PT_NO FROM IPADMISS WHERE TRUNC(IPD_DATE) = :customDate AND IPC_PTFLAG = 'N'
    //SELECT PT_NO FROM IPADMISS WHERE  IPC_PTFLAG = 'N' AND IPC_STATUS IS NULL AND DMC_SLNO IS NULL

    // Get data From oracle database "OUTLET" table
    const result = await conn.execute(
        `SELECT 
            pt_no,
            ptd_date,
            ptc_ptname,
            ptc_type,
            ptc_sex,
            ptd_dob,
            sa_code,
            bg_code,
            oc_code,
            or_code,
            rl_code,
            ms_code,
            rg_code,
            re_code,
            do_code,
            ptc_ptflag,
            cu_code,
            us_code,
            pt_code,
            ptc_flag,
            ptc_mobile,
            ptc_mhcode
        FROM PATIENT 
        WHERE PT_NO IN (SELECT PT_NO FROM IPADMISS WHERE TRUNC(IPD_DATE) = :customDate AND IPC_PTFLAG = 'N' AND IPC_STATUS IS NULL)`,
        [customDate],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    //WHERE PT_NO IN (SELECT PT_NO FROM IPADMISS WHERE TRUNC(IPD_DATE) = :customDate AND IPC_PTFLAG = 'N'
    //customDate

    const userData = await result.resultSet?.getRows();

    //Inser to My sql Database "ora_outlet" table

    try {
        const PatientOpnumber = (callBack) => {
            pool.query(
                `SELECT pt_no FROM ora_patient`,
                [],
                (error, result) => {
                    if (error) {
                        throw error
                    }
                    return callBack(JSON.parse(JSON.stringify(result)));
                }
            )
        }

        PatientOpnumber((result) => {
            const PatietData = result?.map(val => val.pt_no)
            const ActualPtno = userData && userData.filter(val => PatietData.includes(val.PT_NO) === true ? null : val.PT_NO)
            // console.log(ActualPtno)
            // console.log(ActualPtno)
            ActualPtno && ActualPtno.map((value, index) => {
                pool.query(
                    `INSERT INTO ora_patient
                        (pt_no,
                        ptd_date,
                        ptc_ptname,
                        ptc_type,
                        ptc_sex,
                        ptd_dob,
                        sa_code,
                        bg_code,
                        oc_code,
                        or_code,
                        rl_code,
                        ms_code,
                        rg_code,
                        re_code,
                        do_code,
                        ptc_ptflag,
                        cu_code,
                        us_code,
                        pt_code,
                        ptc_flag,
                        ptc_mobile,
                        ptc_mhcode)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        value.PT_NO,
                        value.PTD_DATE,
                        value.PTC_PTNAME,
                        value.PTC_TYPE,
                        value.PTC_SEX,
                        value.PTD_DOB,
                        value.SA_CODE,
                        value.BG_CODE,
                        value.OC_CODE,
                        value.OR_CODE,
                        value.RL_CODE,
                        value.MS_CODE,
                        value.RG_CODE,
                        value.RE_CODE,
                        value.DO_CODE,
                        value.PTC_PTFLAG,
                        value.CU_CODE,
                        value.US_CODE,
                        value.PT_CODE,
                        value.PTC_FLAG,
                        value.PTC_MOBILE,
                        value.PTC_MHCODE
                    ],
                    (error, result) => {
                        if (error) throw error;
                    }
                )
            })
        })
    } catch (err) {
        // console.log(err)
    }

    console.log("OP 5 Minits")
    result.resultSet?.close()
})

module.exports = {
    patientImportJob
}
