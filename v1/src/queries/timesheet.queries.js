const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");

const TimesheetUploadLog = require("../models/timesheet-upload-log.model");
const TimesheetTasks = require("../models/timesheet-tasks.model");

const timesheetQueries = {

  getTimesheetFilterValues: async function (filter) {
    try {

      const { projectId } = filter;

      let whereConditions = [];
      let joins = [];

      let whereQuery = '';
      let joinQuery = '';

      if (projectId) {
        let projectIdCondition = `timesheettasks.projectId = '${projectId}'`;
        whereConditions.push(projectIdCondition);

        let projectIdJoin = `timesheettasks ON timesheettasks.timesheetId = timesheetuploadlog.timesheetId`;
        joins.push(projectIdJoin);
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      joinQuery = joins.length > 0 ? ' JOIN ' + joins.join(' JOIN ') : '';


      const timesheetDataQuery = `
          SELECT
              timesheetuploadlog.originalFileName as timesheetName,
              timesheetuploadlog.uploadedBy,
              company.fiscalYear
          FROM
              timesheetuploadlog
          JOIN
              company ON company.companyId = timesheetuploadlog.companyId
          ${joinQuery}
          ${whereQuery}
      `;

      const timesheetData = await sequelize.query(timesheetDataQuery, { type: Sequelize.QueryTypes.SELECT });

      let timesheetNameSet = new Set();
      let uploadedBySet = new Set();
      let fiscalYearSet = new Set();

      for (const record of timesheetData) {
        if (record.timesheetName) timesheetNameSet.add(record.timesheetName);
        if (record.uploadedBy) uploadedBySet.add(record.uploadedBy);
        if (record.fiscalYear) fiscalYearSet.add(record.fiscalYear);
      }

      const timesheetNames = Array.from(timesheetNameSet).sort();
      const uploadedBy = Array.from(uploadedBySet).sort();
      const fiscalYears = Array.from(fiscalYearSet).sort();

      const status = ['uploaded', 'processing', 'processing completed'];

      return { timesheetNames, fiscalYears, status, uploadedBy };

    } catch (error) {
      console.log("Error fetching timesheet filters list : ", error);
      throw error;
    }
  },

  getTimesheettasksFilterValues: async function (filter) {
    try {
      const { timesheetId, projectId } = filter;

      let whereConditions = [];
      let whereQuery = ``;

      let selects = [];
      let selectQuery = ``;

      if (timesheetId) {
        let timesheetIdCondition = `timesheettasks.timesheetId = '${timesheetId}'`;
        whereConditions.push(timesheetIdCondition);

        selects.push('projects.projectId');
        selects.push('projects.projectCode');
        selects.push('projects.projectName');
      }

      if (projectId) {
        let projectIdCondition = `timesheettasks.projectId = '${projectId}'`;
        whereConditions.push(projectIdCondition);
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      selectQuery = selects.length > 0 ? ',' + selects.join(',') : '';

      const tasksDataQuery = `
          SELECT
              contacts.firstName as name
              ${selectQuery}
          FROM
              timesheettasks
          JOIN
              teammembers ON teammembers.teammemberId = timesheettasks.teammemberId
          JOIN
              contacts ON contacts.contactId = teammembers.contactId
          LEFT JOIN
              projects ON projects.projectId = timesheettasks.projectId
          ${whereQuery}
      `;

      const tasksData = await sequelize.query(tasksDataQuery, { type: Sequelize.QueryTypes.SELECT });

      let projectIdSet = new Set();
      let projectCodeSet = new Set();
      let projectNameSet = new Set();
      let nameSet = new Set();

      for (const record of tasksData) {
        if (record.projectId) projectIdSet.add(record.projectId);
        if (record.projectName) projectNameSet.add(record.projectName);
        if (record.projectCode) projectCodeSet.add(record.projectCode);
        if (record.name) nameSet.add(record.name);
      }

      const projectIds = Array.from(projectIdSet);
      const projectCodes = Array.from(projectCodeSet);
      const projectNames = Array.from(projectNameSet);
      const names = Array.from(nameSet);

      return { projectIds, projectCodes, projectNames, names };

    } catch (error) {
      console.log("Error fetching timesheet tasks filters list : ", error);
      throw error;
    }
  },

  getTasks: async function (filter, sort, pagination) {
    try {

      //filter
      const {
        timesheetId,
        projectIds,
        projectNames,
        names,
        startTaskDate,
        endTaskDate,
        minHourlyRate,
        maxHourlyRate,
        minTaskEfforts,
        maxTaskEfforts,
        minTotalExpense,
        maxTotalExpense,
        minRnDExpense,
        maxRnDExpense
      } = filter;

      let whereConditions = [];
      let whereQuery = ``;
      let taskCountWhereQuery = ``;

      if (timesheetId) {
        const timesheetIdCondition = `tt.timesheetId = '${timesheetId}'`;
        whereConditions.push(timesheetIdCondition);
        taskCountWhereQuery = 'WHERE ' + timesheetIdCondition;
      }

      if (projectIds && projectIds.length > 0) {
        const projectIdCondition = `tt.projectId in ('${projectIds.join("','")}')`;
        whereConditions.push(projectIdCondition);
        taskCountWhereQuery = 'WHERE ' + projectIdCondition;
      }

      if (projectNames && projectNames.length > 0) {
        const projectNameCondition = `projects.projectName in ('${projectNames.join("','")}')`;
        whereConditions.push(projectNameCondition);
      }

      if (names && names.length > 0) {
        const namesCondition = `ct.firstName in ('${names.join("','")}')`;
        whereConditions.push(namesCondition);
      }

      if (startTaskDate || endTaskDate) {
        const startDate = `${startTaskDate} 00:00:00`;
        const endDate = `${endTaskDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const taskDateCondition = `tt.taskDate BETWEEN "${startTaskDate ? startDate : earliestDate}" AND "${endTaskDate ? endDate : latestDate}"`;
        whereConditions.push(taskDateCondition);
      }

      if (minHourlyRate || maxHourlyRate) {
        const hourlyRateCondition = `tt.taskHourlyRate BETWEEN ${minHourlyRate ? minHourlyRate : 0} AND  ${maxHourlyRate ? maxHourlyRate : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(hourlyRateCondition);
      }

      if (minTaskEfforts || maxTaskEfforts) {
        const taskEffortCondition = `tt.taskEffort BETWEEN ${minTaskEfforts ? minTaskEfforts : 0} AND  ${maxTaskEfforts ? maxTaskEfforts : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(taskEffortCondition);
      }

      if (minTotalExpense || maxTotalExpense) {
        const totalExpenseCondition = `tt.taskTotalExpense BETWEEN ${minTotalExpense ? minTotalExpense : 0} AND  ${maxTotalExpense ? maxTotalExpense : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(totalExpenseCondition);
      }

      if (minRnDExpense || maxRnDExpense) {
        const rndExpenseCondition = `tt.RnDExpense BETWEEN ${minRnDExpense ? minRnDExpense : 0} AND  ${maxRnDExpense ? maxRnDExpense : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(rndExpenseCondition);
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';


      //sort
      const { sortField, sortOrder } = sort;
      let orderQuery = ``;

      if (sortField && sortOrder) {
        orderQuery = 'ORDER BY';

        switch (sortField) {
          case 'projectId': orderQuery += ' projects.projectId ';
            break;
          case 'projectName': orderQuery += ' projects.projectName ';
            break;
          case 'projectCode': orderQuery += ' projects.projectCode ';
            break;
          case 'taskDescription': orderQuery += ' tt.taskDescription ';
            break;
          case 'taskDate': orderQuery += ' tt.taskDate ';
            break;
          case 'name': orderQuery += ' ct.firstName ';
            break;
          case 'taskHourlyRate': orderQuery += ' tt.taskHourlyRate ';
            break;
          case 'taskEffort': orderQuery += ' tt.taskEffort ';
            break;
          case 'taskTotalExpense': orderQuery += ' tt.taskTotalExpense ';
            break;
          case 'RnDExpense': orderQuery += ' tt.RnDExpense ';
            break;
        }

        orderQuery = sortOrder == 'dsc' ? orderQuery += 'DESC' : orderQuery;
      }

      const { page, limit } = pagination;

      const tasksDataQuery = `
          SELECT
                tt.*,
                ct.contactId,
                ct.firstName AS name,
                company.currencySymbol as symbol,
                projects.projectId,
                projects.projectCode,
                projects.projectName
          FROM
                certaintiMaster.TimesheetTasks tt
          JOIN
                certaintiMaster.TeamMembers tm ON tm.teamMemberId = tt.teamMemberId
          JOIN
                certaintiMaster.contacts ct ON ct.contactId = tm.contactId
          JOIN
                company on company.companyId = tt.companyId
          LEFT JOIN
                projects ON projects.projectId = tt.projectId
          ${whereQuery}
          ${orderQuery}
          LIMIT ${limit} 
          OFFSET ${page * limit}
      `;

      const tasks = await sequelize.query(tasksDataQuery, { type: Sequelize.QueryTypes.SELECT });

      const tasksCountQuery = `
          SELECT
                COUNT(*) AS count
          FROM
                timesheettasks tt
          LEFT JOIN
                projects on projects.projectId = tt.projectId
          ${taskCountWhereQuery}
      `;

      let totalCount = await sequelize.query(tasksCountQuery, { type: Sequelize.QueryTypes.SELECT });
      totalCount = totalCount[0].count;

      return { totalCount, tasks };

    } catch (error) {
      console.log("Error fetching timesheet tasks filters list : ", error);
      throw error;
    }
  },

  getTimesheetLog: async function (filter, sort) {
    try {

      let appliedSort = 'Uploaded On';
      let appliedFilterList = [];

      //filter
      let filtersArray = [];
      let whereConditions = [];
      let joins = [];

      let whereQuery = '';
      let joinQuery = '';

      if (filter) {
        const {
          companyIds,
          fiscalYears,
          minTotalhours,
          maxTotalhours,
          status,
          uploadedBy,
          projectId,
          startUploadedOn,
          endUploadedOn
        } = filter;

        if (companyIds && companyIds.length > 0) {
          const companyIdCondition = `tu.companyId in ('${companyIds.join("','")}')`;
          whereConditions.push(companyIdCondition);
          appliedFilterList.push('Account');
        }

        if (projectId) {
          const projectIdJoin = `
          (
            SELECT DISTINCT timesheetId from timesheettasks WHERE timesheettasks.projectId = '${projectId}'
          ) AS projectData ON projectData.timesheetId = tu.timesheetId`;
          joins.push(projectIdJoin);
        }

        if (fiscalYears && fiscalYears.length > 0) {
          const fiscalYearCondition = `co.fiscalYear in ('${fiscalYears.join("','")}')`;
          whereConditions.push(fiscalYearCondition);
          appliedFilterList.push('Fiscal Year');
        }

        if (status && status.length > 0) {
          const statusCondition = `tu.status in ('${status.join("','")}')`;
          whereConditions.push(statusCondition);
          appliedFilterList.push('Status');
        }

        if (uploadedBy && uploadedBy.length > 0) {
          const uploadedByCondition = `tu.uploadedBy in ('${uploadedBy.join("','")}')`;
          whereConditions.push(uploadedByCondition);
          appliedFilterList.push('Uploaded By');
        }

        if (minTotalhours || maxTotalhours) {
          let totalHoursCondition = `query.totalhours >= ${minTotalhours ? minTotalhours : 0} AND query.totalhours <= ${maxTotalhours ? maxTotalhours : Number.MAX_SAFE_INTEGER} `;
          whereConditions.push(totalHoursCondition);
          appliedFilterList.push('Total Hours');
        }

        if (startUploadedOn || endUploadedOn) {
          const startDate = `${startUploadedOn} 00:00:00`;
          const endDate = `${endUploadedOn} 23:59:59`;

          const earliestDate = "0000-01-01 00:00:00";
          const latestDate = "9999-12-31 23:59:59";

          const sentCondition = `tu.uploadedOn BETWEEN "${startUploadedOn ? startDate : earliestDate}" AND "${startUploadedOn ? endDate : latestDate}"`;
          whereConditions.push(sentCondition);
          appliedFilterList.push('Uploaded On');
        }

      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      joinQuery = joins.length > 0 ? ' JOIN ' + joins.join(' JOIN ') : '';

      //sort
      const { sortField, sortOrder } = sort;

      let orderQuery = ``;
      if (sortField && sortOrder) {
        orderQuery = 'ORDER BY';

        switch (sortField) {
          case "originalFileName":
            orderQuery += ` tu.originalFileName `;
            appliedSort = 'Timesheet Name';
            break;
          case "accountingYear":
            orderQuery += ` co.fiscalYear `;
            appliedSort = 'Fiscal Year';
            break;
          case "companyName":
            orderQuery += ` co.companyName `;
            appliedSort = 'Account';
            break;
          case "status":
            orderQuery += ` tu.status `;
            appliedSort = 'Status';
            break;
          case "uploadedOn":
            orderQuery += ` tu.uploadedOn `;
            appliedSort = 'Uploaded On';
            break;
          case "uploadedBy":
            orderQuery += ` tu.uploadedBy `;
            appliedSort = 'Uploaded By';
            break;
          case "totalhours":
            orderQuery += ` CAST(NULLIF(query.totalhours, '') AS SIGNED) `;
            appliedSort = 'Total Hours';
            break;
        }

        orderQuery = sortOrder == 'dsc' ? orderQuery + 'DESC' : orderQuery;
        appliedSort = sortOrder == 'dsc' ? appliedSort += ' descending' : appliedSort += ' ascending';
      } else {
        orderQuery = `ORDER BY tu.uploadedOn DESC `;
      }

      const sqlQuery = `
          SELECT 
            tu.*,
            co.companyName,
            CONCAT('TS-', LPAD(tu.timesheetIdentifier, 7, '0')) AS timesheetIdentifier,
            query.totalhours,
            co.fiscalYear AS accountingYear
          FROM 
                certaintiMaster.timesheetUploadLog tu
          LEFT JOIN
                certaintiMaster.company co ON tu.companyId = co.companyId
          LEFT JOIN
                (SELECT 
                    SUM(timesheettasks.taskEffort) as totalHours, 
                    timesheettasks.timesheetId 
                FROM 
                    timesheettasks 
                JOIN 
                    timesheetuploadlog 
                ON 
                    timesheettasks.timesheetId = timesheetuploadlog.timesheetId 
                GROUP BY 
                    timesheettasks.timesheetId
                ) as query ON query.timesheetId = tu.timesheetId
          ${joinQuery}
          ${whereQuery}
          ${orderQuery}
      `;


      const list = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT
      });

      let appliedFilter = appliedFilterList.length > 0 ? appliedFilterList.join(',') : 'None';

      return { list, appliedSort, appliedFilter };

    } catch (error) {
      console.log("Error fetching timesheets: ", error);
      throw error;
    }
  },

  getExistingTimesheetLog: async function (timesheetId) {
    const data = sequelize.query(
      `
        SELECT tu.* ,
          co.companyName,
          CONCAT('TS-', LPAD(tu.timesheetIdentifier, 7, '0')) AS timesheetIdentifier
        FROM certaintiMaster.timesheetUploadLog tu
        LEFT JOIN 
        certaintiMaster.company co ON tu.companyId = co.companyId
        WHERE tu.timesheetId = :timesheetId
      `,
      {
        replacements: { timesheetId },
        type: Sequelize.QueryTypes.SELECT
      }
    )

    return data;
  },

  createTimesheetLog: async function (body) {
    const data = await TimesheetUploadLog.create(body);
    return data;
  },
  updateTimesheet: async function (body, filter) {
    const data = await TimesheetUploadLog.update(body, {
      where: filter
    });
    return data;
  },
  getTimesheetTasks: async function (timesheetId, limit, page) {
    const offset = page * limit;
    const data = await sequelize.query(
      `
      SELECT tt.*, ct.contactId, ct.firstName, ct.lastName, ct.middleName ,company.currencySymbol as symbol,projects.projectCode as projectId
      FROM certaintiMaster.TimesheetTasks tt
      LEFT JOIN certaintiMaster.TeamMembers tm ON tm.teamMemberId = tt.teamMemberId
      LEFT JOIN certaintiMaster.contacts ct ON ct.contactId = tm.contactId
      LEFT JOIN company on company.companyId = tt.companyId
      LEFT JOIN projects on projects.projectIdentifier = tt.projectId
      WHERE timesheetId = :timesheetId
      LIMIT :limit 
      OFFSET :offset
      `,
      {
        replacements: { timesheetId, limit: parseInt(limit), offset: parseInt(offset) },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    return data;
  },

  getTasksCount: async function (timesheetId) {
    const data = TimesheetTasks.count({
      where: { timesheetId }
    });
    return data
  },
  getTimesheetHoursClassification: async function (timesheetId) {
    const data = await TimesheetTasks.findAll({
      attributes: [
        "taskClassification",
        [
          Sequelize.fn("SUM", Sequelize.literal("CAST(taskEffort AS DECIMAL)")),
          "totalTaskEffort",
        ],
      ],
      where: {
        timeSheetId: timesheetId
      },
      group: ["taskClassification"],
    })
    return data;
  },

  getTimesheetProjects: async function (timesheetId) {
    try {

      const sqlQuery = `
        SELECT
            timesheettasks.projectId
        FROM
            timesheettasks
        JOIN
            timesheetuploadlog ON timesheetuploadlog.timesheetId = timesheettasks.timesheetId
        WHERE
            timesheetuploadlog.timesheetId =:timesheetId
        GROUP BY timesheettasks.projectId;
      `;

      const projectIds = await sequelize.query(sqlQuery, {
        replacements: { timesheetId: timesheetId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return projectIds;
    } catch (error) {
      console.log("Error while fetching case project id: ", error);
      throw error;
    }
  },


};

module.exports = timesheetQueries;
