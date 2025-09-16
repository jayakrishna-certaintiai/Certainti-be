const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");

const Project = require("../models/project.model");
const TempProjectKPI = require("../models/project-kpi..model");
const TeamMember = require("../models/project-team.model");
const Timesheets = require("../models/timesheet.model");
const ProjectMilestones = require("../models/project-milestones.model");
const ProjectFinancialDaily = require("../models/project-financials.model");
const Notes = require("../models/notes.model");

const Op = Sequelize.Op;
const notesQueries = {
  getNotesByProject: async function (companyId, projectIds){
    const projs = projectIds.map((item)=>({relationId: item}));
    const data = await Notes.findAll({
      where: {
        [Op.or]:  projs,
        companyId: companyId
      },
    });
    return data;
  },
  getNotesByCompany: async function (companyIds){
    const comps = companyIds.map((item)=>({companyId: item}));
    const data = await Notes.findAll({
      where: {
        [Op.or]:  comps
      },
    });
    return data;
  },
  addNewNotes: async function (companyId, userId ,body, projectId = '', notesId){
    let note = {}
    if(projectId){
        note.notesId = notesId;
        note.companyId = companyId;
        note.relatedTo = 'project';
        note.relationId = projectId;
        note.notes = body.notes;
        note.createdBy = userId
    } else {
        note.notesId = notesId;
        note.companyId = companyId;
        note.relatedTo = 'company';
        note.relationId = companyId;
        note.notes = body.notes;
        note.createdBy = userId
    }
    const data = await Notes.create(note);
    return data;
  },
  editNoteDetails: async function(noteId, companyId, body){
    const data = await Project.update(body, {
      where: {
        noteId, companyId
      }
    });
    return data;
  },
  deleteNote: async function (companyId, notesId){
    const data = await Notes.destroy({
      where: {
        notesId: notesId,
        companyId: companyId
      },
    });
    return data;
  },
};

module.exports = notesQueries