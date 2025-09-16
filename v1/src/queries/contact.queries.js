const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");

const Contact = require("../models/contact.model");
const TeamMember = require("../models/project-team.model");
const ContactSalary = require("../models/contact-salary.model");

// TODO: getExistingContact, createNewContact, updateExistingData
const contactQueries = {

  getContactFilterValuesList: async function (filter) {
    try {

      const { caseId, projectId } = filter;

      let whereConditionsList = [];
      let join = ``;

      if (caseId) {
        join = ` JOIN master_case_project ON master_case_project.projectid = projects.projectId `;
        whereConditionsList.push(`master_case_project.caseid = '${caseId}'`);
      }

      if (projectId) {
        whereConditionsList.push(`projects.projectId = '${projectId}'`);
      }

      const whereQuery = whereConditionsList.length > 0 ? 'WHERE ' + whereConditionsList.join(' AND ') : '';

      const employeeDataQuery = `
          SELECT
              teammembers.employeeId,
              contacts.firstName,
              contacts.employementType,
              contacts.employeeTitle,
              projects.projectId,
              projects.projectCode,
              projects.projectName
          FROM
              teammembers
          JOIN
              projects ON projects.projectId = teammembers.projectId
          JOIN
              contacts ON contacts.contactId = teammembers.contactId
          ${join}
          ${whereQuery};
      `;

      const companyDataQuery = `
          SELECT
              companyId,
              companyName
          FROM
              company
          ORDER BY companyIdentifier;
      `;

      const employeeData = await sequelize.query(employeeDataQuery, { type: Sequelize.QueryTypes.SELECT });

      const companyData = await sequelize.query(companyDataQuery, { type: Sequelize.QueryTypes.SELECT });


      let employeeIdSet = new Set();
      let firstNameSet = new Set();
      let employementTypeSet = new Set();
      let employeeTitleSet = new Set();
      let projectIdSet = new Set();
      let projectCodeSet = new Set();
      let projectNameSet = new Set();

      for (const record of employeeData) {
        if (record.employeeId) employeeIdSet.add(record.employeeId);
        if (record.firstName) firstNameSet.add(record.firstName);
        if (record.employementType) employementTypeSet.add(record.employementType);
        if (record.employeeTitle) employeeTitleSet.add(record.employeeTitle);
        if (record.projectId) projectIdSet.add(record.projectId);
        if (record.projectCode) projectCodeSet.add(record.projectCode);
        if (record.projectName) projectNameSet.add(record.projectName);
      }

      // Convert sets to arrays and sort them
      const employeeIds = Array.from(employeeIdSet).sort();
      const names = Array.from(firstNameSet).sort();
      const employementTypes = Array.from(employementTypeSet).sort();
      const employeeTitles = Array.from(employeeTitleSet).sort();
      const projectIds = Array.from(projectIdSet).sort();
      const projectCodes = Array.from(projectCodeSet).sort();
      const projectNames = Array.from(projectNameSet).sort();

      return {
        employeeIds,
        names,
        employementTypes,
        employeeTitles,
        projectIds,
        projectCodes,
        projectNames,
        accounts: companyData
      }

    } catch (error) {
      console.log("Error fetching employee filters list : ", error);
      throw error;
    }
  },

  getContactFilterValues: async function (filter) {
    try {

      //filter
      const { companyId } = filter;

      let whereConditions = [];
      let whereQuery = '';

      if (companyId) {
        const companyIdCondition = `contacts.companyId = '${companyId}'`;
        whereConditions.push(companyIdCondition);
      }

      if (whereConditions.length > 0) {
        whereQuery = 'WHERE ' + whereConditions.join(' AND ');
      }

      const employeeDataQuery = `
        SELECT
            contacts.firstName AS employeeName,
            contacts.employeeId,
            contacts.employementType,
            contacts.employeeTitle,
            contacts.email,
            company.companyName
        FROM
            contacts
        JOIN
            company ON company.companyId = contacts.companyId
        ${whereQuery};
      `;

      const employeeData = await sequelize.query(employeeDataQuery, { type: Sequelize.QueryTypes.SELECT });

      let employeeNameSet = new Set();
      let employeeIdSet = new Set();
      let employementTypeSet = new Set();
      let employeeTitleSet = new Set();
      let emailSet = new Set();
      let companyNameSet = new Set();

      for (const record of employeeData) {
        if (record.employeeName) employeeNameSet.add(record.employeeName);
        if (record.employeeId) employeeIdSet.add(record.employeeId);
        if (record.employementType) employementTypeSet.add(record.employementType);
        if (record.employeeTitle) employeeTitleSet.add(record.employeeTitle);
        if (record.email) emailSet.add(record.email);
        if (record.companyName) companyNameSet.add(record.companyName);
      }

      let employeeNames = Array.from(employeeNameSet).sort();
      let employeeIds = Array.from(employeeIdSet).sort();
      let employementTypes = Array.from(employementTypeSet).sort();
      let employeeTitles = Array.from(employeeTitleSet).sort();
      let emails = Array.from(emailSet).sort();
      let companyNames = Array.from(companyNameSet).sort();

      return { employeeNames, employeeIds, employementTypes, employeeTitles, emails, companyNames };

    } catch (error) {
      console.log("Error fetching employee filters list : ", error);
      throw error;
    }
  },

  getExistingContact: async function (filter) {
    const data = await Contact.findOne({
      where: filter
    });
    return data
  },
  getContactsList: async function (filter, sort) {
    try {

      let appliedSort = 'Employee ID ascending';
      let appliedFilterList = [];

      //filter
      let whereQuery = ``;
      let whereConditions = [];

      const {
        employeeIds,
        employeeNames,
        employeeTitles,
        employementTypes,
        emails,
        companyIds
      } = filter;

      if (employeeIds && employeeIds.length > 0) {
        const employeeIdQuery = `c.employeeId in ('${employeeIds.join("','")}')`;
        whereConditions.push(employeeIdQuery);
        appliedFilterList.push('Employee ID');
      }

      if (employeeNames && employeeNames.length > 0) {
        const employeeNameQuery = `c.firstName in ('${employeeNames.join("','")}')`;
        whereConditions.push(employeeNameQuery);
        appliedFilterList.push('Employee Name');
      }

      if (employeeTitles && employeeTitles.length > 0) {
        const employeeTitleQuery = `c.employeeTitle in ('${employeeTitles.join("','")}')`;
        whereConditions.push(employeeTitleQuery);
        appliedFilterList.push('Employee Title');
      }

      if (employementTypes && employementTypes.length > 0) {
        const employementTypeQuery = `c.employementType in ('${employementTypes.join("','")}')`;
        whereConditions.push(employementTypeQuery);
        appliedFilterList.push('Employement Type');
      }

      if (emails && emails.length > 0) {
        const emailQuery = `c.email in ('${emails.join("','")}')`;
        whereConditions.push(emailQuery);
        appliedFilterList.push('Email');
      }

      if (companyIds && companyIds.length > 0) {
        const companyQuery = `c.companyId in ('${companyIds.join("','")}')`;
        whereConditions.push(companyQuery);
        appliedFilterList.push('Account');
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      //sort
      const { sortField, sortOrder } = sort;

      let orderQuery = '';

      if (sortField && sortOrder) {
        orderQuery = 'ORDER BY';

        switch (sortField) {
          case 'name':
            orderQuery += ` c.firstName `;
            appliedSort = 'Name';
            break;
          case 'employeeId':
            orderQuery += ` c.employeeId `;
            appliedSort = 'Employee ID';
            break;
          case 'employementType':
            orderQuery += ` c.employementType `;
            appliedSort = 'Employement Type';
            break;
          case 'employeeTitle':
            orderQuery += `  c.employeeTitle `;
            appliedSort = 'Employee Title';
            break;
          case 'companyName':
            orderQuery += ` co.companyName `;
            appliedSort = 'Account';
            break;
          case 'email':
            orderQuery += ` c.email `;
            appliedSort = 'Email';
            break;
        }

        orderQuery = sortOrder == 'dsc' ? orderQuery += 'desc' : orderQuery;
        appliedSort = sortOrder == 'dsc' ? appliedSort += 'descending' : appliedSort += 'ascending';

      } else {
        orderQuery = 'ORDER BY c.modifiedTime DESC'
      }

      const query = `
        SELECT 
          c.*,
          COALESCE(c.firstName, "") AS firstName,
          COALESCE(c.middleName, "") AS middleName,
          COALESCE(c.lastName, "") AS lastName,
          co.companyName
        FROM contacts c
        LEFT JOIN
          company co ON c.companyId = co.companyId
        ${whereQuery}
        ${orderQuery}
      `;


      const list = await sequelize.query(
        query,
        { type: Sequelize.QueryTypes.SELECT }
      )

      let appliedFilter = appliedFilterList.length > 0 ? appliedFilterList.join(',') : 'None';

      return { list, appliedSort, appliedFilter };
    } catch (error) {
      console.log("Error fetching employee list : ", error);
      throw error;
    }
  },
  getContactDetails: async function (contactId) {
    const [data1] = await sequelize.query(
      `
        SELECT c.*, co.currency,co.currencySymbol
        FROM contacts c
        LEFT JOIN
          company co ON c.companyId = co.companyId
        WHERE
          c.contactId = :contactId
      `,
      {
        replacements: { contactId },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    // const data = await Contact.findOne({
    //   where: {
    //     contactId
    //   }
    // });
    return data1;
  },
  createNewContact: async function (body) {
    const data = await Contact.create({
      companyId: body?.companyId,
      firstName: body?.firstName,
      lastName: body?.lastName,
      email: body?.email,
      phone: body?.phone,
      Address: body?.address,
      city: body?.city,
      description: body?.description,
      status: body?.status,
      employeeTitle: body?.employeeTitle,
      country: body?.country,
      employeeType: body?.employeeType,
      Language: body?.language,
      state: body?.state,
      zipcode: body?.zipcode,
      createdBy: body?.createdBy,
      modifiedBy: body?.modifiedBy
    });
    return data;
  },
  updateExistingContact: async function (body, filter) {
    const data = await Contact.update(body, {
      where: filter
    });
    return data
  },
  getProjectsByContactId: async function (contactId, filter, sort) {
    try {

      //filter
      const { projectCodes, projectNames, projectRoles, employeeTitles } = filter;

      let whereConditions = [];
      let whereQuery = ``;

      if (projectCodes && projectCodes.length > 0) {
        const projectCodeCondition = `projects.projectCode in ('${projectCodes.join("','")}')`;
        whereConditions.push(projectCodeCondition);
      }

      if (projectNames && projectNames.length > 0) {
        const projectNameCondition = `projects.projectName in ('${projectNames.join("','")}')`;
        whereConditions.push(projectNameCondition);
      }

      if (projectRoles && projectRoles.length > 0) {
        const projectRoleCondition = `teammembers.projectRole in ('${projectRoles.join("','")}')`;
        whereConditions.push(projectRoleCondition);
      }

      if (employeeTitles && employeeTitles.length > 0) {
        const employeeTitleCondition = `contacts.employeeTitle in ('${employeeTitles.join("','")}')`;
        whereConditions.push(employeeTitleCondition);
      }

      whereQuery = whereConditions.length > 0 ? ' AND ' + whereConditions.join(' AND ') : '';


      //sort
      const { sortField, sortOrder } = sort;

      let orderCaluse = '';
      if (sortField && sortOrder) {
        orderCaluse = 'ORDER BY';
        switch (sortField) {
          case 'projectCode': orderCaluse += ' projects.projectCode ';
            break;
          case 'projectName': orderCaluse += ' projects.projectName ';
            break;
          case 'projectRole': orderCaluse += ' teammembers.projectRole ';
            break;
          case 'employeeTitle': orderCaluse += ' contacts.employeeTitle ';
            break;
        }

        orderCaluse = sortOrder == 'dsc' ? orderCaluse + 'DESC' : orderCaluse;
      }

      const sqlQuery = `
        SELECT
            projects.projectId,
            projects.projectName,
            projects.projectCode,
            teammembers.projectRole,
            contacts.employeeTitle
        FROM
            contacts
        LEFT JOIN
            teammembers ON  contacts.contactid = teammembers.contactid
        LEFT JOIN
            projects ON teammembers.projectId = projects.projectId
        WHERE
            contacts.contactId =:contactId
        ${whereQuery}
        ${orderCaluse};
      `;

      const projects = await sequelize.query(sqlQuery, {
        replacements: { contactId: contactId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return projects;
    } catch (error) {
      console.log("Error while fetching contacts projects: ", error);
      throw error;
    }
  },


  getContactSalary: async function (contactId, sort, filter) {
    try {

      //filter
      let whereConditions = [];
      let whereQuery = ``;

      const {
        minAnnualSalary,
        maxAnnualSalary,
        minHourlyRate,
        maxHourlyRate,
        minStartDate,
        maxStartDate,
        minEndDate,
        maxEndDate
      } = filter;

      if (minAnnualSalary || maxAnnualSalary) {
        const annualSalaryCondition = `annualRate BETWEEN ${minAnnualSalary ? minAnnualSalary : 0} AND  ${maxAnnualSalary ? maxAnnualSalary : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(annualSalaryCondition);
      }

      if (minHourlyRate || maxHourlyRate) {
        const hourlyRateCondition = `hourlyRate BETWEEN ${minHourlyRate ? minHourlyRate : 0} AND  ${maxHourlyRate ? maxHourlyRate : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(hourlyRateCondition);
      }

      if (minStartDate || maxStartDate) {
        const startDate = `${minStartDate} 00:00:00`;
        const endDate = `${maxStartDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const startDateCondition = `startDate BETWEEN "${minStartDate ? startDate : earliestDate}" AND "${maxStartDate ? endDate : latestDate}"`;
        whereConditions.push(startDateCondition);
      }

      if (minEndDate || maxEndDate) {
        const startDate = `${minEndDate} 00:00:00`;
        const endDate = `${maxEndDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const endDateCondition = `startDate BETWEEN "${minEndDate ? startDate : earliestDate}" AND "${maxEndDate ? endDate : latestDate}"`;
        whereConditions.push(endDateCondition);
      }

      //sort
      const { sortField, sortOrder } = sort;
      let orderCaluse = '';

      if (sortField && sortOrder) {
        orderCaluse = 'ORDER BY';
        switch (sortField) {
          case 'annualRate': orderCaluse += ' contactsalary.annualRate ';
            break;
          case 'hourlyRate': orderCaluse += ' contactsalary.hourlyRate ';
            break;
          case 'startDate': orderCaluse += ' contactsalary.startDate ';
            break;
          case 'endDate': orderCaluse += ' contactsalary.endDate ';
            break;
        }

        orderCaluse = sortOrder == 'dsc' ? orderCaluse + 'DESC' : orderCaluse;
      }

      whereQuery = whereConditions.length > 0 ? ' AND ' + whereConditions.join(' AND ') : '';

      const sqlQuery = `
      SELECT
        *
      FROM
        contactsalary
      WHERE
        contactsalary.contactId = :contactId
      ${whereQuery}
      ${orderCaluse};
        `;

      const data = await sequelize.query(sqlQuery, {
        replacements: { contactId: contactId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;
    } catch (error) {
      console.log("Error fetching salary details of contact : ", error);
      throw (error);
    }
  },

  getRnDExpenseTable: async function (contactId, sort, filter) {
    try {

      let whereConditions = [];
      let whereQuery = ``;

      //filter
      const {
        projectCodes,
        projectNames,
        minTotalHours,
        maxTotalHours,
        minHourlyRate,
        maxHourlyRate,
        minRnDExpense,
        maxRnDExpense
      } = filter;

      if (projectCodes && projectCodes.length > 0) {
        const projectIdCondition = `projects.projectCode in ('${projectCodes.join("','")}')`;
        whereConditions.push(projectIdCondition);
      }

      if (projectNames && projectNames.length > 0) {
        const projectNameCondition = `projects.projectName in ('${projectNames.join("','")}')`;
        whereConditions.push(projectNameCondition);
      }

      if (minTotalHours || maxTotalHours) {
        let totalHoursCondition = `timesheettasks.taskEffort BETWEEN ${minTotalHours ? minTotalHours : 0} AND  ${maxTotalHours ? maxTotalHours : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(totalHoursCondition);
      }

      if (minHourlyRate || maxHourlyRate) {
        let hourlyRateCondition = `timesheettasks.taskHourlyRate BETWEEN ${minHourlyRate ? minHourlyRate : 0} AND  ${maxHourlyRate ? maxHourlyRate : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(hourlyRateCondition);
      }

      if (minRnDExpense || maxRnDExpense) {
        let RnDExpenseCondition = `timesheettasks.RnDExpense BETWEEN ${minRnDExpense ? minRnDExpense : 0} AND  ${maxRnDExpense ? maxRnDExpense : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(RnDExpenseCondition);
      }

      //sort
      const { sortField, sortOrder } = sort;
      let orderCaluse = '';

      if (sortField && sortOrder) {
        orderCaluse = 'ORDER BY';
        switch (sortField) {
          case 'projectId': orderCaluse += ' projects.projectId ';
            break;
          case 'projectName': orderCaluse += ' projects.projectName ';
            break;
          case 'totalHours': orderCaluse += ' timesheettasks.taskEffort ';
            break;
          case 'rndExpense': orderCaluse += ' timesheettasks.RnDExpense ';
            break;
          case 'hourlyRate': orderCaluse += ' timesheettasks.taskHourlyRate ';
            break;
        }

        orderCaluse = sortOrder == 'dsc' ? orderCaluse + 'DESC' : orderCaluse;
      }

      whereQuery = whereConditions.length > 0 ? ' AND ' + whereConditions.join(' AND ') : '';

      const sqlQuery = `
      SELECT
              projects.projectName,
              projects.projectId,
              projects.projectCode,
              timesheettasks.RnDExpense AS rndExpense,
              timesheettasks.taskEffort AS totalHours,
              timesheettasks.taskHourlyRate AS hourlyRate
        FROM
              projects
        JOIN
              teammembers ON teammembers.projectId = projects.projectId
        JOIN
              timesheettasks ON timesheettasks.teamMemberId = teammembers.teamMemberId
        WHERE
          teammembers.contactId = :contactId
        ${whereQuery}
        ${orderCaluse};
      `;

      const data = await sequelize.query(sqlQuery, {
        replacements: { contactId: contactId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;
    } catch (error) {
      console.log("Error fetching RnD Details of contact : ", error);
      throw (error);
    }
  },


  getEmployeeSheets: async function (companyId) {
    try {

      let whereClause = `WHERE master_sheets.sheettype = 'wages' OR master_sheets.sheettype = 'employees'`;

      if (companyId) {
        whereClause += ` AND master_sheets.companyid = ${companyId}`;
      }

      const sqlQuery = `
        SELECT
              master_sheets.id,
              master_sheets.sheetid AS sheetId,
              master_sheets.sheetname AS sheetName,
              master_sheets.sheettype AS sheetType,
              master_sheets.url,
              master_sheets.message AS notes,
              master_sheets.status,
              company.companyName,
              company.companyId,
              CONCAT(platformusers.firstName, ' ', COALESCE(platformusers.middleName, ''), ' ', platformusers.lastName) AS uploadedBy,
              master_sheets.createdtime AS uploadedOn
        FROM
              master_sheets
        JOIN
              company ON company.companyId = master_sheets.companyid
        JOIN
              platformusers ON platformusers.userId = master_sheets.createdby
        ${whereClause}
        ORDER BY master_sheets.createdtime DESC;
      `;


      const employeeSheets = await sequelize.query(sqlQuery, {
        // replacements: { projectIdentifier: projectIdentifier, limit: parseInt(limit), offset: parseInt(offset) },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return employeeSheets;
    }
    catch (error) {
      console.log("Error while fetching summary list : ", error);
      throw error;
    }
  },
  // queries/teammembers.js
  getAllTeamMembers: async function (sort, filters, others) {
    try {

      //sort
      const sortHelper = {
        teamMemberId: {
          originalName: "teammembers.teamMemberId",
          sortMessage: "Team Member ID"
        },
        employeeId: {
          originalName: "teammembers.employeeId",
          sortMessage: "Employee ID"
        },
        companyId: {
          originalName: "teammembers.companyId",
          sortMessage: "Company ID"
        },
        firstName: {
          originalName: "contacts.firstName",
          sortMessage: "Name"
        },
        employementType: {
          originalName: "contacts.employementType",
          sortMessage: "Employment Type"
        },
        employeeTitle: {
          originalName: "contacts.employeeTitle",
          sortMessage: "Employee Title"
        },
        companyName: {
          originalName: "company.companyName",
          sortMessage: "Company Name"
        },
        projectId: {
          originalName: "projects.projectId",
          sortMessage: "Project ID"
        },
        projectCode: {
          originalName: "projects.projectCode",
          sortMessage: "Project Code"
        },
        projectName: {
          originalName: "projects.projectName",
          sortMessage: "Project Name"
        },
        hourlyRate: {
          originalName: "salary.hourlyRate",
          sortMessage: "Hourly Rate"
        },
        totalHours: {
          originalName: "teammembers.totalHours",
          sortMessage: "Total Hours"
        },
        totalCost: {
          originalName: "teammembers.totalCost",
          sortMessage: "Total Cost"
        },
        rndCredits: {
          originalName: "teammembers.rndCredits",
          sortMessage: "R&D Credits"
        },
        qreCost: {
          originalName: "teammembers.qreCost",
          sortMessage: "QRE Cost"
        },
        rndPotential: {
          originalName: "rnd.rd_score",
          sortMessage: "R&D Score"
        }
      };


      // Build order query
      let orderQuery = `ORDER BY teammembers.createdTime DESC`;
      let appliedSort = `Created Time descending`;
      const { sortField, sortOrder } = sort;

      if (sortField && sortOrder && sortField in sortHelper) {
        orderQuery = `ORDER BY ${sortHelper[sortField].originalName}`;
        orderQuery += sortOrder === "dsc" ? " DESC" : " ASC";
        appliedSort = sortHelper[sortField].sortMessage;
        appliedSort = sortOrder == 'dsc' ? appliedSort + ' descending' : appliedSort + ' ascending';
      }

      //filter
      let whereConditionsList = [];
      let appliedFiltersList = [];

      let whereQuery = ``;
      let appliedFilter = ``;

      const filterHelper = {
        teamMemberIds: {
          originalName: "teammembers.teamMemberId",
          filterMessage: "Team Member ID",
          dataType: "text"
        },
        employeeIds: {
          originalName: "teammembers.employeeId",
          filterMessage: "Employee ID",
          dataType: "text"
        },
        companyIds: {
          originalName: "teammembers.companyId",
          filterMessage: "Company ID",
          dataType: "text"
        },
        names: {
          originalName: "contacts.firstName",
          filterMessage: "Name",
          dataType: "text"
        },
        employementTypes: {
          originalName: "contacts.employementType",
          filterMessage: "Employment Type",
          dataType: "text"
        },
        employeeTitles: {
          originalName: "contacts.employeeTitle",
          filterMessage: "Employee Title",
          dataType: "text"
        },
        companyNames: {
          originalName: "company.companyName",
          filterMessage: "Company Name",
          dataType: "text"
        },
        projectIds: {
          originalName: "projects.projectId",
          filterMessage: "Project ID",
          dataType: "text"
        },
        projectCodes: {
          originalName: "projects.projectCode",
          sortMessage: "Project Code",
          dataType: "text"
        },
        projectNames: {
          originalName: "projects.projectName",
          sortMessage: "Project Name",
          dataType: "text"
        },
        hourlyRates: {
          originalName: "salary.hourlyRate",
          filterMessage: "Hourly Rate",
          dataType: "number"
        },
        totalHourses: {
          originalName: "teammembers.totalHours",
          filterMessage: "Total Hours",
          dataType: "number"
        },
        totalCosts: {
          originalName: "teammembers.totalCost",
          filterMessage: "Total Cost",
          dataType: "number"
        },
        rndCreditses: {
          originalName: "teammembers.rndCredits",
          filterMessage: "R&D Credits",
          dataType: "number"
        },
        qreCosts: {
          originalName: "teammembers.qreCost",
          filterMessage: "QRE Cost",
          dataType: "number"
        },
        rndPotentials: {
          originalName: "rnd.rd_score",
          filterMessage: "R&D Score",
          dataType: "number"
        }
      };

      for (const filter in filters) {
        if (filter in filterHelper && filters[filter]) {
          const helper = filterHelper[filter];
          const dataType = helper.dataType;
          const originalName = helper.originalName;
          const filterMessage = helper.filterMessage;

          let condition = ``;

          if (dataType == 'text') {
            condition = `${originalName} in ('${filters[filter].join("', '")}')`;
          }

          if (dataType == 'number') {
            condition = `${originalName} >= ${filters[filter][0] ? filters[filter][0] : 0} AND ${originalName} <= ${filters[filter][1] ? filters[filter][1] : Number.MAX_SAFE_INTEGER} `;
          }

          if (dataType == 'date') {
            const startDate = `${filters[filter][0]} 00:00:00`;
            const endDate = `${filters[filter][0]} 23:59:59`;

            const earliestDate = "0000-01-01 00:00:00";
            const latestDate = "9999-12-31 23:59:59";

            condition = `${originalName} "${filters[filter][0] ? startDate : earliestDate}" AND "${filters[filter][1] ? endDate : latestDate}"`;
          }

          whereConditionsList.push(condition);
          appliedFiltersList.push(filterMessage);
        }
      }


      //sub pages
      const { caseId } = others;
      let join = ``;

      if (caseId) {
        join += ` JOIN master_case_project ON master_case_project.projectid = projects.projectId `;
        const caseCondition = `master_case_project.caseid = '${caseId}'`;
        whereConditionsList.push(caseCondition);
      }

      whereQuery = whereConditionsList.length > 0 ? 'WHERE ' + whereConditionsList.join(" AND ") : '';
      appliedFilter = appliedFiltersList.length > 0 ? appliedFiltersList.join(', ') : 'None';


      const sqlQuery = `
        SELECT 
          teammembers.teamMemberId,
          teammembers.employeeId,
          teammembers.companyId,
          COALESCE(contacts.firstName, "") AS firstName,
          COALESCE(contacts.middleName, "") AS middleName,
          COALESCE(contacts.lastName, "") AS lastName,
          contacts.contactId,
          contacts.employementType,
          contacts.employeeTitle,
          company.companyName,
          projects.projectId,
          projects.projectCode,
          projects.projectName,
          salary.hourlyRate,
          teammembers.totalHours,
          teammembers.s_total_cost AS totalCost,
          teammembers.rndCredits,
          teammembers.qreCost,
          rnd.rd_score as rndPotential,
          company.currency,
          company.currencySymbol
        FROM 
          teammembers
        JOIN 
          contacts ON teammembers.contactId = contacts.contactId
        JOIN 
          company ON teammembers.companyId = company.companyId
        JOIN 
          projects ON teammembers.projectId = projects.projectId
        LEFT JOIN (
          SELECT
            *
          FROM
            contactSalary CS1
          WHERE createdTime = (SELECT MAX(createdTime) from contactsalary CS2 where CS1.contactId = CS2.contactId)) AS salary
          ON teammembers.contactId = salary.contactId
        LEFT JOIN (
         SELECT projectId, rd_score FROM master_project_ai_assessment WHERE status = 'active'
        ) as rnd ON rnd.projectId = teammembers.projectId
        ${join}
         ${whereQuery}
        ${orderQuery};
      `;

      const list = await sequelize.query(sqlQuery, {
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      return { list, appliedSort, appliedFilter };
    } catch (error) {
      throw new Error(`Error fetching team members: ${error.message}`);
    }
  },
  fetchEmployeeData: async () => {
    try {
      return [
        { "Employee ID": "Employee ID" },
        { "Type": "Type" },
        { "Designation": "Designation" },
        { "Name": "Name" },
        { "Email": "Email" },
        { "Phone": "Phone" },
        { "Address": "Address" },
        { "Language": "Language" },
        { "Status": "Status" },
        { "City": "City" },
        { "State": "State" }
      ];

    } catch (error) {
      console.error("Error while fetching employee project team data:", error);
      throw error;
    }
  },
  fetchEmployeeWagesData: async () => {
    try {

      return [
        { "Employee ID": "Employee ID" }, 
        { "Hourly Rate": "Hourly Rate" }, 
        { "Start Date": "Start Date" },
        { "End Date": "End Date" }, 
        { "Annual Rate": "Annual Rate" }
      ];

    } catch (error) {
      console.error("Error while fetching employee wages data:", error);
      throw error;
    }
  }

};



module.exports = contactQueries;
