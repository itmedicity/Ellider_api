require("dotenv").config();

const express = require("express");
const fs = require('fs');
const pool = require("./config/database");
const app = express();
const schedule = require('node-schedule');
const oracledb = require('oracledb');

const { oraConnection } = require('./config/oracleConn');
// const { testjob } = require('./Test')


// Oracle Ellider From tmcdb
const { userUpload_job } = require('./Eliider_import/scheduler/ora_users');
const { outletUploadJob } = require('./Eliider_import/scheduler/ora_outlets')
const { nurstationJob } = require('./Eliider_import/scheduler/ora_nurstation')
const { doctorJob } = require('./Eliider_import/scheduler/ora_doctor')
const { roomCategoryJob } = require('./Eliider_import/scheduler/ora_roomcategory')
const { roomTypeJob } = require('./Eliider_import/scheduler/ora_romtype')
const { roomMasterJob } = require('./Eliider_import/scheduler/ora_roommaster')
const { bedJob } = require('./Eliider_import/scheduler/ora_bed')
const { patientImportJob } = require('./Eliider_import/scheduler/ora_patient')
const { ipAdmissJob } = require('./Eliider_import/scheduler/ora_ipadmiss')
const { ipadmissUpdation } = require('./Eliider_import/scheduler/oraIpadmisUpdation')

app.use(express.json());

// @ts-ignore
app.listen(process.env.APP_PORT, () =>
    console.log(`Server Up and Running ${process.env.APP_PORT}`),
);
