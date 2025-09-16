const { Router } = require("express");
const {
    getNotes,
    editNote,
    createCompanyNote,
    createProjectNote,
    deleteNote,
    getNotesForProject
} = require("../controllers/notes.controller");

const notesRouter = Router();

notesRouter.get("/:user/get-notes", getNotes);
notesRouter.get("/:user/:company/get-notes", getNotesForProject);
notesRouter.put("/:user/:company/:noteId/edit-note", editNote);
notesRouter.post("/:user/:company/add-new-note", createCompanyNote);
notesRouter.post("/:user/:company/:projectId/add-new-note", createProjectNote);
notesRouter.delete("/:user/:company/:noteId", deleteNote);

module.exports = notesRouter;
