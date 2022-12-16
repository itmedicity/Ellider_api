const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')
const moment = require('moment');

const { oraConnection } = require('../../config/oracleConn');


const customDate = moment().format("DD-MMM-YYYY")
// const customDate = '24-sep-2022'
const customDateMysql = moment().format("YYYY-MM-DD")

const ipadmissUpdation = schedule.scheduleJob('18 * * * *', async () => {
    const conn = await oraConnection();
    // Get data From oracle database "OUTLET" table
    const result = await conn.execute(
        `SELECT 
            ip_no,
            rc_code,
            bd_code,
            do_code,
            ipd_disc,
            dmc_slno,
            dmd_date,
            ipc_status
        FROM IPADMISS WHERE  IPC_PTFLAG = 'N' AND IPC_STATUS IS NULL AND DMC_SLNO IS NULL`,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
    )

    const elliderIpPatient = await result.resultSet?.getRows();
    // console.log(elliderIpPatient)
    //Inser to My sql Database "ora_outlet" table

    try {

        const mysqlIpPatient = (callBack) => {
            pool.query(
                `SELECT 
                    ip_no,
                    rc_code,
                    bd_code,
                    do_code,
                    ipd_disc,
                    ipc_status 
                FROM ora_ipadmiss 
                WHERE ipc_status IS NULL`,
                [],
                (error, result) => {
                    if (error) {
                        throw error
                    }
                    return callBack(JSON.parse(JSON.stringify(result)));
                }
            )
        }

        mysqlIpPatient((patientIpNo) => {
            // console.log(patientIpNo)
            const filterOraIpPatient = patientIpNo?.map(val => val.ip_no);
            // console.log(filterOraIpPatient)
            const ActualIpAdmissionEllider = elliderIpPatient && elliderIpPatient.filter(val => filterOraIpPatient.includes(val.IP_NO) === true ? val.IP_NO : null)
            // console.log(ActualIpAdmissionEllider)
            /***
             * For Checking bed Number chNged in the Ellider "IPADMISS" table 
             * If there is any changes then filter the and get the changed value as object
             * and Update the changed value in the "ora_ipadmiss" table 
             */

            const bedfilterValue = ActualIpAdmissionEllider?.map((eliiderPtVal) => {
                const filterValueMysql = patientIpNo?.map((sqlPtVal) => {
                    const patientFilter = eliiderPtVal.IP_NO === sqlPtVal.ip_no && eliiderPtVal.BD_CODE !== sqlPtVal.bd_code
                    const patientFilterVal = patientFilter === true ? eliiderPtVal : null;
                    return patientFilterVal
                })
                return filterValueMysql;
            })

            const updatedEliiderPtValue4Bed = bedfilterValue?.flat().filter(val => val)
            // console.log(updatedEliiderPtValue)

            //Updation to the "ora_ipadmiss"  table
            updatedEliiderPtValue4Bed && updatedEliiderPtValue4Bed.map((val) => {
                const updateBedCodeSql = `UPDATE ora_ipadmiss SET bd_code = ?,rc_code = ? WHERE ip_no = ?`;
                pool.query(updateBedCodeSql, [val.BD_CODE, val.RC_CODE, val.IP_NO], (error, result, feild) => {
                    if (error) {
                        throw error
                    }
                })
            })

        })

    } catch (err) {
        console.log(`Error Updating Bed code and Room Category`)
        console.log(err)
    } finally {
        result.resultSet?.close()
    }


    //fOR uPDATING tHE dISCHARGE dETAILS iPC_sTATUS aND iPD_dATE

    try {

        const ellierDisPatList = await conn.execute(
            `SELECT 
                ip_no,
                rc_code,
                bd_code,
                do_code,
                ipd_disc,
                dmc_slno,
                dmd_date,
                ipc_status
            FROM IPADMISS WHERE  TRUNC(IPD_DATE) = :customDate AND IPC_PTFLAG = 'N' AND IPC_STATUS IS NOT NULL`,
            [customDate],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        const elliderIpDisPatient = await ellierDisPatList.resultSet?.getRows();

        // console.log(elliderIpDisPatient)

        const mysqlIpPatientList = (callBack) => {
            pool.query(
                `SELECT ip_no,rc_code,bd_code,do_code,ipd_disc,ipc_status FROM ora_ipadmiss WHERE ipc_status IS NULL`,
                [],
                (error, result) => {
                    if (error) {
                        throw error
                    }
                    return callBack(JSON.parse(JSON.stringify(result)));
                }
            )
        }

        mysqlIpPatientList((patientIpNo) => {
            // console.log(elliderIpDisPatient)
            // console.log(patientIpNo)
            const filterOraIpPatient = patientIpNo?.map(val => val.ip_no);
            // console.log(filterOraIpPatient)
            const ActualIpAdmissionEllider = elliderIpDisPatient && elliderIpDisPatient.filter(val => filterOraIpPatient.includes(val.IP_NO) === true ? val.IP_NO : null)
            console.log(ActualIpAdmissionEllider)
            /***
             * For Updating the Patient DIscharge Details 
             */

            ActualIpAdmissionEllider && ActualIpAdmissionEllider.map((val) => {
                const updateDisStatSql = `UPDATE ora_ipadmiss SET ipd_disc = ?,dmc_slno = ?,dmd_date = ?,ipc_status = ? WHERE ip_no = ?`;
                pool.query(
                    updateDisStatSql,
                    [val.IPD_DISC, val.DMC_SLNO, val.DMD_DATE, val.IPC_STATUS, val.IP_NO],
                    (error, result, feild) => {
                        if (error) {
                            throw error
                        }
                    })
            })


        })

    } catch (err) {
        console.log(`Error Updating Discharge Patient List`)
        console.log(err)
    }

})


module.exports = {
    ipadmissUpdation
}