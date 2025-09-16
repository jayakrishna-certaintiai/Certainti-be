const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const timesheets = require("../queries/timesheet.queries");
const { users } = require("../../data/user.data");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { axiosRequest } = require("../utils/axios");
const { uploadFileToAzureStorage } = require('../utils/azureBlobStorage');
const authQueries = require("../queries/auth.queries");
const timesheetQueries = require("../queries/timesheet.queries");
const TimesheetUploadLog = require("../models/timesheet-upload-log.model");
const fs = require("fs");

const getTimesheetFilterValues = async (req, res) => {
  try {

    const filter = {
      projectId: req.query.projectId
    }

    const data = await timesheetQueries.getTimesheetFilterValues(filter);

    return res.status(200).json(new ApiResponse(data, "Timesheet filters values fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getTimesheetTasksFilterValues = async (req, res) => {
  try {

    const filter = {
      timesheetId: req.query.timesheetId,
      projectId: req.query.projectId
    };

    const data = await timesheetQueries.getTimesheettasksFilterValues(filter);

    return res.status(200).json(new ApiResponse(data, "Timesheet filters values fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getTasks = async (req, res) => {
  try {

    const filter = {
      timesheetId: req.query.timesheetId,
      projectIds: req.query.projectIds ? JSON.parse(req.query.projectIds.replace(/'/g, '"')) : null,
      projectNames: req.query.projectNames ? JSON.parse(req.query.projectNames.replace(/'/g, '"')) : null,
      names: req.query.names ? JSON.parse(req.query.names.replace(/'/g, '"')) : null,
      startTaskDate: req.query.startTaskDate,
      endTaskDate: req.query.endTaskDate,
      minHourlyRate: req.query.minHourlyRate,
      maxHourlyRate: req.query.maxHourlyRate,
      minTaskEfforts: req.query.minTaskEfforts,
      maxTaskEfforts: req.query.maxTaskEfforts,
      minTotalExpense: req.query.minTotalExpense,
      maxTotalExpense: req.query.maxTotalExpense,
      minRnDExpense: req.query.minRnDExpense,
      maxRnDExpense: req.query.maxRnDExpense
    }

    const sort = {
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder
    };

    const pagination = {
      page: req.query.page,
      limit: req.query.limit
    }

    const data = await timesheetQueries.getTasks(filter, sort, pagination);

    return res.status(200).json(new ApiResponse(data, "Tasks fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const fetchTimesheetUploadLogs = async (req, res) => {
  try {

    const filter = {
      companyIds: req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null,
      fiscalYears: req.query.fiscalYears ? JSON.parse(req.query.fiscalYears.replace(/'/g, '"')) : null,
      minTotalhours: req.query.minTotalhours ? req.query.minTotalhours : null,
      maxTotalhours: req.query.maxTotalhours ? req.query.maxTotalhours : null,
      status: req.query.status ? JSON.parse(req.query.status.replace(/'/g, '"')) : null,
      uploadedBy: req.query.uploadedBy ? JSON.parse(req.query.uploadedBy.replace(/'/g, '"')) : null,
      projectId: req.query.projectId,
      startUploadedOn: req.query.startUploadedOn,
      endUploadedOn: req.query.endUploadedOn
    };

    const sort = {
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder
    }

    const timeshhetList = await timesheetQueries.getTimesheetLog(filter, sort);

    return res.status(200).json(new ApiResponse(timeshhetList, "Timesheets fetched successfully.", true));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const checkToUpdate = async (req, res) => {
  try {
    const { month, year, companyId } = req.body;

    if ([month, year, companyId].some((field) => field?.trim() === "")) {
      return res
        .status(422)
        .json(new ApiError("Fill all required fields.", 422));
    }

    const timesheetId = `${companyId}-${month}-${year}`;
    let existingEntry = await timesheets.getTimesheetLog({ timesheetId });

    if (existingEntry.length !== 0) {
      return res
        .status(200)
        .json(new ApiResponse({ upload: false, update: true }));
    }

    return res
      .status(200)
      .json(new ApiResponse({ upload: true, update: false }));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const uploadTimesheet = async (req, res) => {
  try {

    const { month, year, companyId } = req.body;
    const userId = req.params.userId;
    const file = req.file;

    if (!file || !companyId || !month || !year) {
      return res.status(422).json(
        new ApiError(
          "File not found, Upload again, or missing fields.",
          422
        )
      )
    }


    const userExists = await authQueries.getUserProfile(userId);
    const userName = userExists.firstName + " " + userExists.lastName;

    let timesheetId = `${companyId}-${month}-${year}`;

    let existingEntry = await timesheets.getExistingTimesheetLog(timesheetId);
    if (existingEntry.length !== 0) {
      const timesheet = await uploadFileToAzureStorage(file);
      fs.unlinkSync(file.path);

      const uTimesheet = await timesheets.updateTimesheet(
        {
          url: timesheet.url
        },
        {
          timesheetId: existingEntry[0].timesheetId
        }
      );


      if (Array.isArray(uTimesheet)) {
        const triggerETL = axiosRequest(
          "post",
          process.env.WEBHOOK_REUPLOAD_URL,
          {
            id: existingEntry[0].timesheetId,
            timesheetName: timesheet.blobName
          }
        );

        if (triggerETL.error) {
          return res
            .status(422)
            .json(new ApiError(triggerETL.error, 422));
        }
        return res.status(200).json(
          new ApiResponse(uTimesheet, "Timesheet updated successfully.")
        )
      }
      return res
        .status(422)
        .json(new ApiError("Error in updating timesheet", 422));
    } else {

      const timesheet = await uploadFileToAzureStorage(file);
      const createEntry = await timesheets.createTimesheetLog({
        timesheetId: timesheetId,
        companyId: companyId,
        userId: userId,
        url: timesheet.url,
        uploadedBy: userName,
        month: month,
        year: year,
        status: "uploaded",
        originalFileName: file.originalname
      });

      if (createEntry.timesheetId) {
        const triggerETL = axiosRequest(
          "post",
          process.env.WEBHOOK_UPLOAD_URL,
          {
            id: createEntry.timesheetId,
            timesheetName: timesheet.blobName
          }
        );
        if (triggerETL.error) {
          return res
            .status(422)
            .json(
              new ApiError(triggerETL.error, 422)
            );
        }
      }




      return res.status(200).json(
        new ApiResponse(
          createEntry,
          "Timesheet uploaded successfully."
        )
      )
    }


  } catch (error) {
    return res.status(500).json(
      new ApiError(
        error.message,
        500,
        error
      )
    )
  }
};

const fetchTimesheetDetails = async (req, res) => {
  try {
    const { userId, companyId, timesheetId } = req.params;
    const { page, limit } = req.query;

    const data = await timesheets.getTimesheetTasks(timesheetId, limit, page);
    const count = await timesheets.getTasksCount(timesheetId);
    const cumulativeHrsClassification = await timesheets.getTimesheetHoursClassification(timesheetId);
    cumulativeHrsClassification.forEach(item => {
      switch (item.taskClassification) {
        case "Pending":
          item.taskClassification = "Uncertain";
          break;
        case "Non-Routine":
          item.taskClassification = "RND";
          break;
      }
    });
    return res
      .status(200)
      .json(new ApiResponse({ totalCount: count, tasks: data, cumulativeHrsClassification }, "Timesheet Details fetched successfully."));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const reUploadTimesheet = async (req, res) => {
  try {
    const { userId, companyId, timesheetId } = req.params;
    const file = req.file;

    if (!file || !companyId || !timesheetId) {
      return res.status(422).json(
        new ApiError(
          "File not found, Upload again, or missing fields.",
          422
        )
      )
    }

    const existingEntry = await timesheets.getTimesheetLog({ timesheetId });

    if (existingEntry.length !== 0) {
      const timesheet = await uploadOnCloudinary(file.path);
      const uTimesheet = await timesheets.updateTimesheet(
        {
          url: timesheet.url
        },
        {
          timesheetId: existingEntry[0].timesheetId
        }
      );

      if (Array.isArray(uTimesheet)) {
        const triggerETL = axiosRequest(
          "post",
          process.env.WEBHOOK_REUPLOAD_URL,
          { id: existingEntry[0].timesheetId }
        );

        if (triggerETL.error) {
          return res
            .status(422)
            .json(new ApiError(triggerETL.error, 422));
        }

        return res
          .status(200)
          .json(
            new ApiResponse(uTimesheet, "Timesheet updated successfully.")
          )
      }
    }
    else {
      return res
        .status(422)
        .json(new ApiError("Error in updating timesheet", 422));
    }
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const triggerAi = async (req, res) => {
  try {
    const { timesheetId } = req.params;

    const timesheet = await TimesheetUploadLog.findOne({
      where: {
        timesheetId: timesheetId
      }
    });

    if (!timesheet) {
      return res.status(400).json(new ApiResponse(null, "Invalid timeshhet id", false));
    }

    const projectIds = await timesheetQueries.getTimesheetProjects(timesheetId);

    for (const projectId of projectIds) {
      const triggerSummary = axiosRequest(
        "post",
        process.env.AI_GENERATE_SUMMARY,
        {
          projectId: projectId.projectId,
          companyId: timesheet.dataValues.companyId
        }
      );
    }

    return res.status(200).json(new ApiResponse(null, "Ai triggered for the timesheet", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

module.exports = {
  uploadTimesheet,
  fetchTimesheetUploadLogs,
  checkToUpdate,
  fetchTimesheetDetails,
  reUploadTimesheet,
  triggerAi,
  getTimesheetFilterValues,
  getTimesheetTasksFilterValues,
  getTasks
};
