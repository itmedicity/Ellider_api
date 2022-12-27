const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');
const { checkOraDoctorAlredyExcist } = require('./Func/FilterFunction');

const doctorJob = schedule.scheduleJob('0 */6 * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    try {

        // Get data From oracle database "OUTLET" table
        const result = await oraConn.execute(
            `SELECT 
                do_code,
                doc_name,
                dt_code,
                sp_code,
                doc_status
            FROM doctor`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        const outletDataFromOra = await result.resultSet?.getRows();

        checkOraDoctorAlredyExcist((outletDataFromMysql) => {
            const userId = outletDataFromMysql.map((val) => val.do_code);

            let newUserArray = outletDataFromOra?.filter((value) => {
                return userId.includes(value.DO_CODE) === true ? null : value;
            })

            newUserArray && newUserArray.map((value, index) => {
                pool.query(
                    `INSERT INTO ora_doctor
                        (do_code,
                        doc_name,
                        dt_code,
                        sp_code,
                        doc_status)
                    VALUES(?,?,?,?,?)`,
                    [
                        value.DO_CODE,
                        value.DOC_NAME,
                        value.DT_CODE,
                        value.SP_CODE,
                        value.DOC_STATUS
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
        console.log('patient-completed')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }

})


module.exports = {
    doctorJob
}
