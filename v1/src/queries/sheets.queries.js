const { Sequelize, Op, where } = require("sequelize");
const sequelize = require("../setups/db");
const Contact = require("../models/contact.model");
const { v4: uuidv4 } = require("uuid");
const MasterCompanyMapper = require("../models/master-company-mapper.model");
const constants = require("../constants");


const sheetsQueries = {

    createCompanyProjectMapper: async function (companyId) {
        try {

            const sheetType = 'projects';
            const columnType = 'default';
            const mandatoryColumns = constants.PROJECT_SHEETS_MANDATORY_COLUMNS;

            // const defaultProjectMapperValues = {
            //     dbColumnName:"Sheet Column Name"
            // }

            const defaultProjectMapperValues = {
                projectCode: "Project ID",
                projectName: "Project Name",
                spocName: "SPOC Name",
                spocEmail: "SPOC Email",
                s_project_status: "Project Status",
                s_fte_cost: "Project Cost - FTE",
                s_subcon_cost: "Project Cost - Subcon",
                s_total_project_cost: "Project Cost - Total",
                s_fte_hours: "Project Hours - FTE",
                s_subcon_hours: "Project Hours - Subcon",
                s_total_hours: "Project Hours - Total",
                s_rnd_adjustment: "QRE(%) - Adjustment",
                s_fte_qre_cost: "QRE - FTE",
                s_subcon_qre_cost: "QRE - Subcon",
                s_qre_cost: "QRE - Total",
                s_rd_credits: "R&D Credits",
                s_data_gathering: "Data Gathering",
                s_pending_data: "Pending Data",
                s_timesheet_status: "Timesheet Status",
                s_fte_cost_status: "Cost Status - Employee",
                s_subcon_cost_status: "Cost Status - Subcon",
                s_interaction_status: "Interaction - Status",
                s_technical_interview_status: "Technical Interview Status",
                s_technical_summary_status: "Technical Summary Status",
                s_financial_summary_status: "Financial Summary Status",
                s_claims_form_status: "Claims Form Status",
                s_final_review_status: "Final Review Status",
                s_notes: "Notes",


                oldSpocName: "Old SPOC Name",
                oldSpocEmail: "Old SPOC Email",
                s_rnd_status: "R&D Status",
                projectType: "Project Type",
                description: "Description",
                startDate: "Start Date",
                endDate: "End Date",
                plannedDuration: "Planned Duration",
                actualStartDate: "Actual Start Date",
                actualEndDate: "Actual End Date",
                actualDuration: "Actual Duration",
                projectsIndustry: "Project Industry",
                natureofProject: "Nature Of Project",
                successCriteria: "Success Criteria",
                techStack: "Tech Stack",
                projectManager: "Project Manager",
                technicalContact: "Technical Contact"
            };


            let sequence = 1;
            for (const key in defaultProjectMapperValues) {

                let status = 'active';
                for (const column of mandatoryColumns) {
                    if (column == key) {
                        status = 'mandatory';
                        break;
                    }
                }

                const masterCompanyMapperData = {
                    id: uuidv4(),
                    sequence: sequence,
                    companyid: companyId,
                    sheettype: sheetType,
                    columnname: key,
                    sheetcolumnname: defaultProjectMapperValues[key],
                    columntype: columnType,
                    status: status
                }

                sequence++;
                await MasterCompanyMapper.create(masterCompanyMapperData);
            }

            const masterCompanyMapperDataForExtra = {
                id: uuidv4(),
                sequence: -1,
                companyid: companyId,
                sheettype: sheetType,
                columnname: 'extras',
                sheetcolumnname: 'extras',
                columntype: columnType,
                status: 'active'
            }
            await MasterCompanyMapper.create(masterCompanyMapperDataForExtra);


        } catch (error) {
            console.error("Error creating project mapper:", error);
            throw error;
        }
    },


    createCompanyEmployeeMapper: async function (companyId) {
        try {

            const sheetType = 'employee';
            const columnType = 'default';
            const mandatoryColumns = constants.EMPLOYEE_SHEETS_MANDATORY_COLUMNS;

            const defaultEmployeeMapperValues = {
                employeeId: "Employee ID",
                employementType: "Type",
                employeeTitle: "Designation",
                firstName: "Name",
                email: "Email",

                phone: "Phone",
                Address: "Address",
                Language: "Language",
                status: "Status",
                city: "City",
                state: "State"
            };


            let sequence = 1;
            for (const key in defaultEmployeeMapperValues) {

                let status = 'active';
                for (const column of mandatoryColumns) {
                    if (column == key) {
                        status = 'mandatory';
                        break;
                    }
                }

                const masterCompanyMapperData = {
                    id: uuidv4(),
                    sequence: sequence,
                    companyid: companyId,
                    sheettype: sheetType,
                    columnname: key,
                    sheetcolumnname: defaultEmployeeMapperValues[key],
                    columntype: columnType,
                    status: status
                }

                sequence++;
                await MasterCompanyMapper.create(masterCompanyMapperData);
            }

            const masterCompanyMapperDataForExtra = {
                id: uuidv4(),
                sequence: -1,
                companyid: companyId,
                sheettype: sheetType,
                columnname: 'extras',
                sheetcolumnname: 'extras',
                columntype: columnType,
                status: 'active'
            }
            await MasterCompanyMapper.create(masterCompanyMapperDataForExtra);


        } catch (error) {
            console.error("Error creating employee mapper:", error);
            throw error;
        }
    },


    createCompanyProjectTeamMapper: async function (companyId) {
        try {

            const sheetType = 'project team';
            const columnType = 'default';
            const mandatoryColumns = constants.PROJECT_TEAM_SHEETS_MANDATORY_COLUMNS;

            const defaultProjectTeamMapperValues = {
                employeeid: "Employee ID",
                employementType: "Type",
                employeeTitle: "Designation",
                firstName: "Name",
                email: "Email",

                phone: "Phone",
                Address: "Address",
                Language: "Language",
                status: "Status",
                city: "City",
                state: "State",
                projectCode: "Project ID",
                projectRole: "Project Role",
                s_total_cost: "Total Cost"
            };


            let sequence = 1;
            for (const key in defaultProjectTeamMapperValues) {

                let status = 'active';
                for (const column of mandatoryColumns) {
                    if (column == key) {
                        status = 'mandatory';
                        break;
                    }
                }

                const masterCompanyMapperData = {
                    id: uuidv4(),
                    sequence: sequence,
                    companyid: companyId,
                    sheettype: sheetType,
                    columnname: key,
                    sheetcolumnname: defaultProjectTeamMapperValues[key],
                    columntype: columnType,
                    status: status
                }

                sequence++;
                await MasterCompanyMapper.create(masterCompanyMapperData);
            }

            const masterCompanyMapperDataForExtra = {
                id: uuidv4(),
                sequence: -1,
                companyid: companyId,
                sheettype: sheetType,
                columnname: 'extras',
                sheetcolumnname: 'extras',
                columntype: columnType,
                status: 'active'
            }
            await MasterCompanyMapper.create(masterCompanyMapperDataForExtra);


        } catch (error) {
            console.error("Error creating project team mapper:", error);
            throw error;
        }
    },


    createCompanyPayrollMapper: async function (companyId) {
        try {
            const sheetType = 'payroll';
            const columnType = 'default';
            const mandatoryColumns = constants.PAYROLL_SHEETS_MANDATORY_COLUMNS;

            const defaultProjectTeamMapperValues = {
                employeeId: "Employee ID",
                hourlyRate: "Hourly Rate",
                startDate: "Start Date",
                endDate: "End Date",
                annualRate: "Annual Rate"
            };


            let sequence = 1;
            for (const key in defaultProjectTeamMapperValues) {

                let status = 'active';
                for (const column of mandatoryColumns) {
                    if (column == key) {
                        status = 'mandatory';
                        break;
                    }
                }

                const masterCompanyMapperData = {
                    id: uuidv4(),
                    sequence: sequence,
                    companyid: companyId,
                    sheettype: sheetType,
                    columnname: key,
                    sheetcolumnname: defaultProjectTeamMapperValues[key],
                    columntype: columnType,
                    status: status
                }

                sequence++;
                await MasterCompanyMapper.create(masterCompanyMapperData);
            }

            const masterCompanyMapperDataForExtra = {
                id: uuidv4(),
                sequence: -1,
                companyid: companyId,
                sheettype: sheetType,
                columnname: 'extras',
                sheetcolumnname: 'extras',
                columntype: columnType,
                status: 'active'
            }
            await MasterCompanyMapper.create(masterCompanyMapperDataForExtra);
        } catch (error) {
            console.error("Error creating payroll mapper:", error);
            throw error;
        }
    },


    getCompanyMapper: async function (companyId, sheetType) {
        try {

            const sqlQuery = `
                SELECT
                    master_company_mapper.id,
                    master_company_mapper.sequence,
                    master_company_mapper.columnname AS columnName,
                    master_company_mapper.sheetcolumnname AS sheetColumnName,
                    master_company_mapper.columntype AS columnType,
                    master_company_mapper.status
                FROM
                    master_company_mapper
                WHERE
                    companyid = :companyId AND sheettype = :sheetType
                ORDER BY master_company_mapper.sequence;
            `;

            const projectsMapper = await sequelize.query(sqlQuery, {
                replacements: { companyId: companyId, sheetType: sheetType },
                type: Sequelize.QueryTypes.SELECT
            });

            if (projectsMapper.length == 0) {
                return null;
            }

            return projectsMapper;

        } catch (error) {
            console.error("Error fetching project mapper:", error);
            throw error;
        }
    },


    addNewColumns: async function addNewColumns(companyId, sheetType, newColumns) {
        try {

            //convert the new columns names to lower case and remove special characters
            let columns = {};
            newColumns.forEach(column => {
                let processedColumn = column.toLowerCase().replace(/[^a-z0-9]/g, '');
                columns[processedColumn] = column;
            });

            const columnType = 'user';
            const status = 'active';

            let maxSequence = await MasterCompanyMapper.max('sequence', {
                where: {
                    companyid: companyId,
                    sheettype: sheetType,
                }
            });
            let sequence = maxSequence + 1;

            for (const key in columns) {

                const masterCompanyMapperData = {
                    id: uuidv4(),
                    sequence: sequence,
                    companyid: companyId,
                    sheettype: sheetType,
                    columnname: key,
                    sheetcolumnname: columns[key],
                    columntype: columnType,
                    status: status
                }

                sequence++;

                await MasterCompanyMapper.create(masterCompanyMapperData);
            }

        } catch (error) {
            console.error("Error adding new columns in project mapper:", error);
            throw error;
        }
    },


    updateColumns: async function updateColumns(companyId, sheetType, updateColumns) {
        try {

            for (const element of updateColumns) {

                const updateMasterCompanyMapperData = {
                    sheetcolumnname: element.sheetColumnName,
                    status: element.status
                }

                await MasterCompanyMapper.update(
                    updateMasterCompanyMapperData,
                    {
                        where: {
                            companyid: companyId,
                            sheettype: sheetType,
                            columnname: element.columnName
                        }
                    }
                );
            }

        } catch (error) {
            console.error("Error updating columns in project mapper:", error);
            throw error;
        }
    },

    getSheetcolumnnamesToColumnnames: async function (companyId, sheetType) {
        try {
            const sqlQuery = `
                SELECT 
                        columnname,
                        sheetcolumnname
                FROM
                        master_company_mapper
                WHERE
                        companyid =:companyId AND sheettype =:sheetType;
            `;

            const data = await sequelize.query(sqlQuery, {
                replacements: { companyId: companyId, sheetType: sheetType },
                type: Sequelize.QueryTypes.SELECT
            });

            let SheetcolumnnameToColumnname = {};
            for (const element of data) {
                columnName = element.columnname;
                sheetColumnName = element.sheetcolumnname;

                SheetcolumnnameToColumnname[sheetColumnName] = columnName;
            }

            return SheetcolumnnameToColumnname;

        } catch (error) {
            console.error("Error fetching data:", error);
            throw error;
        }
    },

    getMandatorySheetColumns: async function (companyId, sheetType) {
        try {
            const sqlQuery = `
                SELECT 
                        sheetcolumnname
                FROM
                        master_company_mapper
                WHERE
                        companyid =:companyId AND sheettype =:sheetType AND status = 'mandatory';
            `;

            const data = await sequelize.query(sqlQuery, {
                replacements: { companyId: companyId, sheetType: sheetType },
                type: Sequelize.QueryTypes.SELECT
            });

            let sheetColumnNames = [];
            for (const element of data) {
                sheetColumnNames.push(element.sheetcolumnname);
            }

            return sheetColumnNames;

        } catch (error) {
            console.error("Error updating columns in project mapper:", error);
            throw error;
        }
    },

    updateProjectIds: async function () {
        try {
            const sqlQuery = `
                  UPDATE projects SET projectId = projectidentifier;
            `;

            await sequelize.query(sqlQuery, {
                type: Sequelize.QueryTypes.UPDATE,
                raw: true,
            });

        } catch (error) {
            console.error("Error updating project ids:", error);
            throw error;
        }
    },

    getContact: async function (companyId, employeeId) {
        try {
            const contact = await Contact.findOne({
                where: {
                    companyId: companyId,
                    employeeId: employeeId
                }
            });

            if (!contact) return null;
            return contact.dataValues;
        } catch (error) {
            console.error("Error fetching employee record:", error);
            throw error;
        }
    },
    getSheetFilterValues: async function () {
        try {
            const sheetDataQuery = `
                SELECT DISTINCT
                    ms.sheettype AS sheetType,
                    company.companyId,
                    company.companyName,
                    CONCAT(platformusers.firstName, ' ', platformusers.lastName) AS uploadedBy,
                    ms.status
                FROM
                    master_sheets ms
                JOIN
                    company ON company.companyId = ms.companyid
                LEFT JOIN
                    platformusers ON platformusers.userId = ms.createdby;
            `;

            const sheetData = await sequelize.query(sheetDataQuery, { type: Sequelize.QueryTypes.SELECT });

            let sheetTypeSet = new Set();
            let companySet = new Set();
            let uploadedBySet = new Set();
            let statusSet = new Set();

            for (const record of sheetData) {
                if (record.sheetType) sheetTypeSet.add(record.sheetType);
                if (record.companyName) companySet.add(record.companyName );
                if (record.uploadedBy) uploadedBySet.add(record.uploadedBy);
                if (record.status) statusSet.add(record.status);
            }

            let sheetTypes = Array.from(sheetTypeSet);
            let companies = Array.from(companySet);
            let uploadedBy = Array.from(uploadedBySet);
            let status = Array.from(statusSet);

            return { sheetTypes, companies, uploadedBy, status };

        } catch (error) {
            console.log("Error fetching uploaded sheets filter values: ", error);
            throw error;
        }
    },
    getUploadedSheetsList: async function (sort, filters) {
        try {
            let appliedSort = 'Sheet ID descending';
            let appliedFilterList = [];
            let whereConditions = ['projectid IS NULL'];

            // Filtering conditions
            if (filters.sheetTypes && filters.sheetTypes.length > 0) {
                whereConditions.push(`ms.sheettype IN ('${filters.sheetTypes.join("','")}')`);
                appliedFilterList.push('Sheet Type');
            }
            if (filters.companyIds && filters.companyIds.length > 0) {
                whereConditions.push(`ms.companyid IN ('${filters.companyIds.join("','")}')`);
                appliedFilterList.push('Company');
            }
            if (filters.uploadedBy && filters.uploadedBy.length > 0) {
                whereConditions.push(`CONCAT(platformusers.firstName, ' ', platformusers.lastName) IN ('${filters.uploadedBy.join("','")}')`);
                appliedFilterList.push('Uploaded By');
            }
            if (filters.status && filters.status.length > 0) {
                whereConditions.push(`ms.status IN ('${filters.status.join("','")}')`);
                appliedFilterList.push('Status');
            }
            if (filters.startUploadedOn || filters.endUploadedOn) {
                const startDate = `${filters.startUploadedOn} 00:00:00`;
                const endDate = `${filters.endUploadedOn} 23:59:59`;
                whereConditions.push(`ms.createdtime BETWEEN '${filters.startUploadedOn ? startDate : "0000-01-01 00:00:00"}' AND '${filters.endUploadedOn ? endDate : "9999-12-31 23:59:59"}'`);
            }

            let whereQuery = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Sorting conditions
            const { sortField, sortOrder } = sort;
            let orderQuery = 'ORDER BY ms.sheetid DESC';

            if (sortField && sortOrder) {
                orderQuery = 'ORDER BY ';
                switch (sortField) {
                    case 'sheet_id':
                         orderQuery += 'ms.sheetid'; 
                         appliedSort = 'Sheet ID'; 
                         break;
                    case 'sheet_name':
                         orderQuery += 'ms.sheetname'; 
                         appliedSort = 'Sheet Name'; 
                         break;
                    case 'sheet_type':
                         orderQuery += 'ms.sheettype'; 
                         appliedSort = 'Sheet Type'; 
                         break;
                    case 'account_name':
                         orderQuery += 'company.companyName'; 
                         appliedSort = 'Company Name'; 
                         break;
                    case 'uploaded_by':
                         orderQuery += `CONCAT(platformusers.firstName, ' ', platformusers.lastName)`; 
                         appliedSort = 'Uploaded By'; 
                         break;
                    case 'uploaded_on':
                         orderQuery += 'ms.createdtime'; 
                         appliedSort = 'Uploaded On'; 
                         break;
                    case 'status':
                         orderQuery += 'ms.status'; 
                         appliedSort = 'Status'; 
                         break;
                    case 'Total_records':
                         orderQuery += 'ms.totalrecords'; 
                         appliedSort = 'Total Records'; 
                         break;
                    case 'processed_records':
                         orderQuery += 'ms.acceptedrecords'; 
                         appliedSort = 'Processed Records'; 
                         break;
                    default:
                         orderQuery += 'ms.sheetid';
                }
                orderQuery += sortOrder === 'dsc' ? ' DESC' : ' ASC';
                appliedSort += sortOrder === 'dsc' ? ' descending' : ' ascending';
            }

            const sqlQuery = `
            SELECT 
                ms.sheetid AS sheet_id,
                ms.sheetname AS sheet_name,
                ms.sheettype AS sheet_type,
                company.companyId AS account_id,
                company.companyName AS account_name,
                CONCAT(platformusers.firstName, ' ', platformusers.lastName) AS uploaded_by,
                ms.createdtime AS uploaded_on,
                ms.status AS status,
                ms.totalrecords AS Total_records,
                ms.acceptedrecords AS processed_records
            FROM 
                master_sheets ms
            LEFT JOIN
                company ON ms.companyid = company.companyId
            LEFT JOIN
                platformusers ON ms.createdby = platformusers.userId
            ${whereQuery}
            ${orderQuery}
        `;

            const data = await sequelize.query(sqlQuery, {
                type: Sequelize.QueryTypes.SELECT,
                raw: true
            });

            let appliedFilter = appliedFilterList.length > 0 ? appliedFilterList.join(', ') : 'None';

            return { list: data, appliedSort, appliedFilter };

        } catch (error) {
            console.log("Error while fetching project report list: ", error);
            throw error;
        }
    },
}

module.exports = sheetsQueries;