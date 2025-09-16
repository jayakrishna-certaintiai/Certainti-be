const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const {users} = require('../../data/user.data');
const {tasks} = require('../../data/task.data');
const { getGreeting } = require('../utils/getGreeting');
const authQueries = require("../queries/auth.queries");
const homeQueries = require("../queries/home.queries");
const companyQueries = require("../queries/company.queries");

const welcomeAlerts = async (req, res) => {
    try {
        const user = await authQueries.getUserProfile(req.params.user);
        var greetingObject = getGreeting();
        const welcomeMessage = `${greetingObject.greeting} ${user.firstName} ${user.lastName}, ${greetingObject.message}`

        const data = {
            message: welcomeMessage
        }

        return res.status(200).json(
            new ApiResponse(
                data,
                "Welcome message and tasks fetched successfully."
            )
        )
    } catch (error) {
        return res.status(500).json(
            new ApiError(
                500,
                error.message
            )
        )
    }
};

const homePageKpis = async (req, res) => {
    try {
        const data = await homeQueries.getKpis(req.companyAccess);
        return res.status(200).json(
            new ApiResponse(
                data,
                "Welcome message and tasks fetched successfully."
            )
        )
    } catch (error) {
        return res.status(500).json(
            new ApiError(
                error.message,
                500,
                error
            )
        )
    }
}

const createRecentlyViewed = async (req, res) => {
    try {
        // route: {{local}}/api/v1/:user/create-recently-viewed-entry

        /*
            {
                "viewedId": "",
                "viewedEntity": "",
                "viewedUITime": ""
            }
        */

        const {user} = req.params
        const userDetails = await authQueries.getUserAccess(user)
        const userName = userDetails.data.firstName
        req.body.createdBy = userName;
        req.body.modifiedBy = userName;

        const { viewedId, viewedEntity, viewedUITime } = req.body

        const entryExists = await homeQueries.getRVEntry({viewedId})

        if(entryExists[0]){
            const updateVisitTime = await updateRVRntry(viewedId, {viewedUITime})
            return res.status(200).json(
                new ApiResponse([], "Visit timestamp updated successfully.")
            )
        }

        const createVisitEntry = await createRVEntry(req.body)
        return res
            .status(201)
            .json(
            new ApiResponse(data, "Entry created in recently viewed.")
            );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getRecentlyViewedData = async (req, res) => {
    try {
        const {user} = req.params;
        const {viewedEntity} = req.query;

        if(viewedEntity = "clients"){
            const getViewedList = await homeQueries.getRVEntry({viewedEntity})

            console.log(getViewedList)
            //const getCompanies = await companyQueries.getCompanies(companyIds)
        }
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}



module.exports = {
  welcomeAlerts,
  homePageKpis,
  createRecentlyViewed,
  getRecentlyViewedData
};

/*
    viewedId	varchar(45) PK
	viewedEntity	varchar(32)
	userId	varchar(32)
	viewedUITime	datetime
	createdBy	varchar(32)
	createdTime	datetime
	modifiedBy	varchar(32)
	modifiedTime	datetime
	sysModTime	datetime
*/