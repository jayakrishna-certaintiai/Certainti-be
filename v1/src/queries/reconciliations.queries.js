const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");

const Reconciliations = require("../models/reconciliation.model");
const TimesheetTasks = require("../models/timesheet-tasks.model");
const Interactions = require("../models/interactions.model");

const reconciliations = {
    getReconciliationsList: async function (filters={}){
      let whereClause = '';
      const filterKeys = Object.keys(filters);
      if (filterKeys.length > 0) {
        whereClause += ' WHERE ';
    
        filterKeys.forEach((key, index) => {
          const values = Array.isArray(filters[key]) ? filters[key] : [filters[key]];
          let column = key;
    
          // Check for ambiguous columns and prefix with table aliases
          if (key === 'timesheetId') {
            column = 't.timesheetId';
          } else if (key === 'companyId') {
            column = 'c.companyId';
          } else if (key === 'projectId') {
            column = 'p.projectId';
          }
    
          whereClause += `${index > 0 ? 'AND ' : ''}${column} IN (${values.map(() => '?').join(', ')}) `;
        });
      }
      let query = `
      SELECT 
        CONCAT('WB-', LPAD(r.reconciliationIdentifier, 7, '0')) AS reconciliationIdentifier,
        r.reconcileId,
        r.reconcileStatus,
        r.reconcileRevision,
        r.reconcileSummary,
        r.reconcileRnDHoursOverride,
        r.reconcileNonRnDHoursOverride,
        r.reconcileTaskOverrideDesc,
        c.companyName,
        c.companyId,
        p.projectId,
        p.projectName,
        t.timesheetId,
        t.timesheetMonth, 
        t.timesheetYear,
        ct.contactId,
        ct.firstName,
        ct.lastName,
        ct.middleName,
        COALESCE(NonRoutine.SumNonRoutineTaskEffort, 0) AS rndHours,
        COALESCE(Uncertain.SumUncertainTaskEffort, 0) AS uncertainHours,
        COALESCE(Routine.SumRoutineTaskEffort, 0) AS routineHours
      FROM 
          Reconciliations r
      LEFT JOIN company c ON r.companyId = c.companyId
      LEFT JOIN Timesheets t ON t.timesheetId = r.timesheetId
      LEFT JOIN projects p ON p.projectId = r.projectId
      LEFT JOIN TeamMembers tm ON tm.teamMemberId = p.projectManagerId
      LEFT JOIN contacts ct ON ct.contactId = tm.contactId
      LEFT JOIN (
          SELECT 
              timesheetId, 
              projectId, 
              SUM(taskEffort) AS SumNonRoutineTaskEffort
          FROM 
              TimesheetTasks
          WHERE 
              taskClassification = 'Non-Routine'
          GROUP BY 
              timesheetId, 
              projectId
      ) AS NonRoutine ON r.timesheetId = NonRoutine.timesheetId AND r.projectId = NonRoutine.projectId
      LEFT JOIN (
          SELECT 
              timesheetId, 
              projectId, 
              SUM(taskEffort) AS SumUncertainTaskEffort
          FROM 
              TimesheetTasks
          WHERE 
              taskClassification = 'Uncertain'
          GROUP BY 
              timesheetId, 
              projectId
      ) AS Uncertain ON r.timesheetId = Uncertain.timesheetId AND r.projectId = Uncertain.projectId
      LEFT JOIN (
          SELECT 
              timesheetId, 
              projectId, 
              SUM(taskEffort) AS SumRoutineTaskEffort
          FROM 
              TimesheetTasks
          WHERE 
              taskClassification = 'Routine'
          GROUP BY 
              timesheetId, 
              projectId
      ) AS Routine ON r.timesheetId = Routine.timesheetId AND r.projectId = Routine.projectId
      ${whereClause}
      ORDER BY
        uncertainHours DESC
      `
      const replacements = filterKeys.flatMap(key => filters[key]);
      const [data] = await sequelize.query(query, { replacements });
      return data;
    },
    getReconciliationOverview: async function (reconcileId){
        const [data] = await sequelize.query(
            `
            SELECT 
              CONCAT('WB-', LPAD(r.reconciliationIdentifier, 7, '0')) AS reconciliationIdentifier,
              r.reconcileId,
              r.reconcileStatus,
              r.reconcileRevision,
              r.reconcileSummary,
              r.reconcileRnDHoursOverride,
              r.reconcileNonRnDHoursOverride,
              r.reconcileTaskOverrideDesc,
              r.projectId,
              p.projectName,
              p.projectManagerId,
              c.companyName,
              c.companyId,
              t.timesheetId,
              t.timesheetMonth, 
              t.timesheetYear,
              ct.contactId,
              ct.firstName,
              ct.lastName,
              ct.middleName,
              COALESCE(NonRoutine.SumNonRoutineTaskEffort, 0) AS rndHours,
              COALESCE(Uncertain.SumUncertainTaskEffort, 0) AS uncertainHours,
              COALESCE(Routine.SumRoutineTaskEffort, 0) AS routineHours
            FROM 
                Reconciliations r
            LEFT JOIN company c ON r.companyId = c.companyId
            LEFT JOIN Timesheets t ON t.timesheetId = r.timesheetId
            LEFT JOIN projects p ON p.projectId = r.projectId
            LEFT JOIN TeamMembers tm ON tm.teamMemberId = p.projectManagerId
            LEFT JOIN contacts ct ON ct.contactId = tm.contactId
            LEFT JOIN (
              SELECT 
                  timesheetId, 
                  projectId, 
                  SUM(taskEffort) AS SumNonRoutineTaskEffort
              FROM 
                  TimesheetTasks
              WHERE 
                  taskClassification = 'Non-Routine'
              GROUP BY 
                  timesheetId, 
                  projectId
            ) AS NonRoutine ON r.timesheetId = NonRoutine.timesheetId AND r.projectId = NonRoutine.projectId
            LEFT JOIN (
              SELECT 
                  timesheetId, 
                  projectId, 
                  SUM(taskEffort) AS SumRoutineTaskEffort
              FROM 
                  TimesheetTasks
              WHERE 
                  taskClassification = 'Routine'
              GROUP BY 
                  timesheetId, 
                  projectId
            ) AS Routine ON r.timesheetId = Routine.timesheetId AND r.projectId = Routine.projectId
            LEFT JOIN (
                SELECT 
                    timesheetId, 
                    projectId, 
                    SUM(taskEffort) AS SumUncertainTaskEffort
                FROM 
                    TimesheetTasks
                WHERE 
                    taskClassification = 'Uncertain'
                GROUP BY 
                    timesheetId, 
                    projectId
            ) AS Uncertain ON r.timesheetId = Uncertain.timesheetId AND r.projectId = Uncertain.projectId
            WHERE r.reconcileId = :reconcileId
            `,
            {
              replacements: { reconcileId },
              type: Sequelize.QueryTypes.SELECT,
            }
        );

        const timesheetId = data.timesheetId ? data.timesheetId : null;
        const projectId = data.projectId ? data.projectId : null;

        const uncertainTasks = await sequelize.query(`
          SELECT 
            tt.taskDate, 
            tt.taskDescription, 
            tt.taskEffort, 
            ct.contactId, 
            ct.firstname, 
            ct.middleName, 
            ct.lastName
          FROM 
            TimesheetTasks tt
          JOIN TeamMembers tm ON tt.teamMemberId = tm.teamMemberId
          JOIN contacts ct ON ct.contactId = tm.contactId
          WHERE 
            tt.timesheetId = :timesheetId AND
            tt.projectId = :projectId AND
            tt.taskClassification = 'Uncertain'
        `,{
          replacements: { timesheetId, projectId  },
          type: Sequelize.QueryTypes.SELECT,
        })
        return {data, uncertainTasks};
    },
    reconcileUncertainHours: async function (body,reconcileId){
      const data = await Reconciliations.update(body, {
        where: {
          reconcileId: reconcileId
        }
      });

      const data1 = await Interactions.findOne({
        where: {
          relationId: reconcileId
        },
        order: [['sysModTime', 'DESC']] // Order by timestamp in descending order to get the latest one
      });

      if(data1){
        const createEntry = await Interactions.create({
          companyId: data1.companyId,
          conversationId: data1.interactionID,
          interactionTo: data1.interactionTo,
          interactionFrom: data1.interactionFrom,
          EmailSenderName: data1.EmailSenderName,
          ccRecipients: data1.ccRecipients,
          interactionTime: new Date(Date.now()),
          interactionActivityType: data1.interactionActivityType,
          interactionSubject: data1.interactionSubject,
          interactionDesc: `Uncertain Hours Revised: ${body.reconcileRevision} || RnD Hours: ${body.reconcileRnDHoursOverride} || Non RnD Hours: ${body.reconcileNonRnDHoursOverride} || Summary: ${reconcileSummary}`,
          relatedTo: data1.relatedTo,
          relationId: data1.relationId,
          createdBy: body.createdBy ? body.createdBy: null,
          modifiedBy: body.modifiedBy ? body.modifiedBy: null
        });
      }
      return data;
    }
}

module.exports = reconciliations