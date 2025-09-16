const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const recentlyViewed = require("../queries/recentlyviewed.queries");

const getRecentlyViewed = async (req, res) => {
  try {
    const { recentlyViewedFilters } = req.query;
    const { user } = req.params;
    const data = await recentlyViewed.getRecentlyViewedList(recentlyViewedFilters, user);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Recently Viewed Items fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const createRecentlyViewed = async (req, res) => {
    try {
      const {
        viewedId,
        viewedEntity,
        viewedUITime,
      } = req.body;
      const { user } = req.params;
      const data = await recentlyViewed.createRecentlyViewedItem(
        viewedId,
        viewedEntity,
        user,
        viewedUITime,
      );
      return res
        .status(201)
        .json(
          new ApiResponse(data, "Recently Viewed Item saved successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const deleteRecentlyViewed = async (req, res) => {
    try {
      const { rvId } = req.params;
      const data = await recentlyViewed.deleteRecentlyViewedItem(rvId);
      return res
        .status(202)
        .json(
          new ApiResponse(data, "Recently Viewed Item deleted successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};


module.exports = {
    getRecentlyViewed,
    createRecentlyViewed,
    deleteRecentlyViewed
};
