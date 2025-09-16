const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const projects = require("../queries/project.queries");
const notes = require("../queries/notes.queries");
const { v4: uuidv4 } = require('uuid');

const getNotes = async (req, res) => {
  try {
    const { companyIds } = req.query;
    const companyIdsArr = JSON.parse(companyIds.replace(/'/g, '"'));
    const data = await notes.getNotesByCompany(companyIdsArr);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Notes fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getNotesForProject = async (req, res) => {
    try {
      const { company } = req.params;
      const { projectIds } = req.query;
      const projectIdsArr = JSON.parse(projectIds.replace(/'/g, '"'));
      const data = await notes.getNotesByProject(company, projectIdsArr);
      return res
        .status(200)
        .json(
          new ApiResponse(data, "Notes fetched successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
  };

const editNote = async (req, res) => {
  try {
    const { noteId, company } = req.params;
    const data = await notes.editNoteDetails(noteId, company, req.body);
    return res
      .status(202)
      .json(
        new ApiResponse(data, "Note details updated successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const createProjectNote = async (req, res) => {
    try {
      let notesId = uuidv4().split('-').join('');
      const { company, user, projectId } = req.params;
      const data = await notes.addNewNotes(company, user , req.body, projectId, notesId);
      return res
        .status(201)
        .json(
          new ApiResponse(data, "Project note saved successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};
const createCompanyNote = async (req, res) => {
    try {
      let notesId = uuidv4().split('-').join('');
      const { company, user } = req.params;
      const data = await notes.addNewNotes(company, user , req.body,'', notesId);
      return res
        .status(201)
        .json(
          new ApiResponse(data, "Company note saved successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const deleteNote = async (req, res) => {
    try {
      const { company, noteId } = req.params;
      const data = await notes.deleteNote(company, noteId);
      return res
        .status(202)
        .json(
          new ApiResponse(data, "Notes data deleted successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};


module.exports = {
    getNotes,
    editNote,
    createProjectNote,
    createCompanyNote,
    deleteNote,
    getNotesForProject
};
