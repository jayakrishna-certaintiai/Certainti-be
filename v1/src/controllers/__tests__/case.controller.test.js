const { sendSurveys } = require('../case.controller');
const { ApiError } = require('../../utils/ApiError');

jest.mock('../../models/master-case.model');
jest.mock('../../models/master-case-project.model');
jest.mock('../../models/project.model');
jest.mock('../../models/company.model');
jest.mock('../../models/system-status.model');
jest.mock('../../models/system-survey-template.model');

const MasterCase = require('../../models/master-case.model');
const MasterCaseProjects = require('../../models/master-case-project.model');
const Project = require('../../models/project.model');
const Company = require('../../models/company.model');
const SystemStatus = require('../../models/system-status.model');
const SystemSurveyTemplate = require('../../models/system-survey-template.model');

describe('sendSurveys', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: { user: 'u1', caseId: 'case1' },
      body: { caseProjectIds: ['cp1'] }
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    SystemStatus.findOne.mockResolvedValue({ dataValues: { id: 1 } });
    Company.findOne.mockResolvedValue({ dataValues: { ccmails: '', companyId: 'cid', fiscalYear: 2024 } });
    SystemSurveyTemplate.findOne.mockResolvedValue({ dataValues: { id: 1 } });
    Project.findOne.mockResolvedValue({ dataValues: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when case not found', async () => {
    MasterCase.findOne.mockResolvedValue(null);
    await sendSurveys(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error.message).toBe('Case/Project not found');
  });

  it('returns 404 when caseProjectId is invalid', async () => {
    MasterCase.findOne.mockResolvedValue({ dataValues: { companyid: 'cid' } });
    MasterCaseProjects.findOne.mockResolvedValue(null);
    await sendSurveys(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error.message).toBe('Case/Project not found');
  });
});
=======
process.env.ACTIVE_SURVEY_TEMPLATE = 'TEST';
process.env.SURVEY_LINK = 'http://survey.link';
process.env.SURVEY_ACTIVE_DAYS = '30';
process.env.SURVEY_DUE_DATE_OFFSET = '5';
process.env.SURVEY_CIPHER_KEY = 'cipher';

// Mock models and utilities used in sendSurveys
jest.mock('../../models/master-case.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/company.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/system-survey-template.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../models/system-survey-question.model', () => ({
  bulkCreate: jest.fn(),
}));
jest.mock('../../queries/case.queries', () => ({}));
jest.mock('../../queries/survey.queries', () => ({}));
jest.mock('../../utils/fileToDatabase', () => ({
  surveySheetsProcessor: jest.fn(),
}));
jest.mock('../../models/master-case-project.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/project.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/master-survey.model', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../models/master-survey-control.model', () => ({
  create: jest.fn(),
}));
jest.mock('../../models/master-survey-assignment.model', () => ({
  create: jest.fn(),
}));
jest.mock('../../models/system-status.model', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../utils/crypto', () => ({
  encryptText: jest.fn(),
}));
jest.mock('../../utils/mailGraphApi', () => ({
  sendFile: jest.fn(),
}));
jest.mock('../../queries/company.queries', () => ({
  getOrCreateCompanyMailConfiguration: jest.fn(),
}));
jest.mock('../../utils/csv', () => ({
  createExcelFile: jest.fn(),
}));

const fs = require('fs').promises;
jest.mock('fs', () => ({
  promises: { unlink: jest.fn() },
}));

const SystemStatus = require('../../models/system-status.model');
const MasterCase = require('../../models/master-case.model');
const Company = require('../../models/company.model');
const SystemSurveyTemplate = require('../../models/system-survey-template.model');
const MasterCaseProjects = require('../../models/master-case-project.model');
const Project = require('../../models/project.model');
const MasterSurvey = require('../../models/master-survey.model');
const MasterSurveyControl = require('../../models/master-survey-control.model');
const MasterSurveyAssignment = require('../../models/master-survey-assignment.model');
const crypto = require('../../utils/crypto');
const { sendFile } = require('../../utils/mailGraphApi');
const companyQueries = require('../../queries/company.queries');
const { createExcelFile } = require('../../utils/csv');
const { sendSurveys } = require('../case.controller');

describe('sendSurveys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock sequential calls
    SystemStatus.findOne
      .mockResolvedValueOnce({ dataValues: { id: 'open-status' } })
      .mockResolvedValueOnce({ dataValues: { id: 'sent-status' } });

    MasterCase.findOne.mockResolvedValue({ dataValues: { companyid: 'company1' } });
    Company.findOne.mockResolvedValue({
      dataValues: { companyId: 'company1', fiscalYear: 2023, companyName: 'Comp', ccmails: '' },
    });
    SystemSurveyTemplate.findOne.mockResolvedValue({ dataValues: { id: 'template1' } });
    MasterCaseProjects.findOne.mockResolvedValue({
      dataValues: { projectid: 'project1', spocemail: 'spoc@example.com', spocname: 'Spoc' },
    });
    Project.findOne.mockResolvedValue({
      dataValues: { surveyCCMails: '', projectName: 'Project', projectCode: 'PRJ', accountingYear: 2023 },
    });
    MasterSurvey.findOne.mockResolvedValue(null);
    MasterSurveyControl.create.mockResolvedValue({ id: 'control1' });
    MasterSurvey.create.mockResolvedValue({
      id: 'survey1',
      dataValues: { surveyid: 123, id: 'survey1' },
      sentdate: new Date().toISOString(),
    });
    crypto.encryptText.mockReturnValue('encrypted');
    MasterSurveyAssignment.create.mockResolvedValue({});
    companyQueries.getOrCreateCompanyMailConfiguration.mockResolvedValue({
      dataValues: { body: 'body with ${url}', subject: 'subject ${projectName}' },
    });
    createExcelFile.mockResolvedValue('/tmp/test.csv');
    sendFile.mockResolvedValue({});
    fs.unlink.mockRejectedValue(new Error('fail'));
  });

  test('should return success even when fs.unlink fails', async () => {
    const req = {
      params: { user: 'u1', caseId: 'c1' },
      body: { caseProjectIds: ['p1'] },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await sendSurveys(req, res);

    expect(sendFile).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Survey link sent successfully.',
      data: null,
    });
  });
});
