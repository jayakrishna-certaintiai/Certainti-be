/**
 * Project Summary Agent API Routes
 * 
 * Provides REST API endpoints for the Project Summary Agent
 */

const express = require('express');
const router = express.Router();
const ProjectSummaryAgent = require('../agents/projectSummaryAgent');

/**
 * GET /api/v1/project-summary/health
 * Health check endpoint for the project summary agent
 */
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await ProjectSummaryAgent.healthCheck();
        
        if (healthStatus.success) {
            res.status(200).json(healthStatus);
        } else {
            res.status(503).json(healthStatus);
        }
    } catch (error) {
        console.error('Project Summary Agent health check error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

/**
 * GET /api/v1/project-summary/:projectId
 * Get formatted project summary by project ID
 */
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        const result = await ProjectSummaryAgent.getFormattedSummary(projectId);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                projectId: projectId,
                summary: result.formattedSummary,
                data: result.rawData,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message,
                projectId: projectId,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error fetching project summary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/v1/project-summary/query
 * Answer user queries based on project summary
 */
router.post('/query', async (req, res) => {
    try {
        const { projectId, question } = req.body;
        
        if (!projectId || !question) {
            return res.status(400).json({
                success: false,
                message: 'Both projectId and question are required',
                required: ['projectId', 'question']
            });
        }

        console.log(`🔍 Processing query for project ${projectId}: "${question}"`);
        
        const result = await ProjectSummaryAgent.answerQuery(projectId, question);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                projectId: projectId,
                question: question,
                answer: result.answer,
                projectInfo: result.projectInfo,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message,
                projectId: projectId,
                question: question,
                answer: result.answer,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error processing query:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/v1/project-summary/raw/:projectId
 * Get raw project summary data (without formatting)
 */
router.get('/raw/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        const result = await ProjectSummaryAgent.fetchProjectSummary(projectId);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                projectId: projectId,
                data: result.data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message,
                projectId: projectId,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error fetching raw project summary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/v1/project-summary/company/:companyId
 * Get all project summaries for a company
 */
router.get('/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        const result = await ProjectSummaryAgent.instance.fetchCompanyProjectSummaries(companyId);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message,
                companyId: companyId,
                projectCount: result.data.length,
                projects: result.data,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.message,
                companyId: companyId,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error fetching company project summaries:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/v1/project-summary/chat
 * Smart chat endpoint that detects project context and answers accordingly
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, projectId, context } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // If no project ID provided, try to extract from context or message
        let targetProjectId = projectId;
        
        if (!targetProjectId && context && context.selectedProject) {
            targetProjectId = context.selectedProject.projectId || context.selectedProject.id;
        }

        if (!targetProjectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required. Please select a project first.',
                suggestion: 'Select a project from the sidebar to ask questions about its summary.'
            });
        }

        console.log(`💬 Smart chat for project ${targetProjectId}: "${message}"`);
        
        // Check if user is asking for summary display
        const summaryKeywords = ['summary', 'summarize', 'overview', 'details', 'about this project'];
        const isSummaryRequest = summaryKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );

        let result;
        
        if (isSummaryRequest) {
            // Return formatted summary
            result = await ProjectSummaryAgent.getFormattedSummary(targetProjectId);
            
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Project summary retrieved',
                    projectId: targetProjectId,
                    userMessage: message,
                    response: result.formattedSummary,
                    responseType: 'summary',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: result.message,
                    projectId: targetProjectId,
                    userMessage: message,
                    response: "I couldn't find a summary for this project. The project may not have a summary generated yet.",
                    responseType: 'error',
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Answer specific query using LLM
            result = await ProjectSummaryAgent.answerQuery(targetProjectId, message);
            
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    projectId: targetProjectId,
                    userMessage: message,
                    response: result.answer,
                    responseType: 'query_answer',
                    projectInfo: result.projectInfo,
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: result.message,
                    projectId: targetProjectId,
                    userMessage: message,
                    response: result.answer,
                    responseType: 'error',
                    error: result.error,
                    timestamp: new Date().toISOString()
                });
            }
        }
    } catch (error) {
        console.error('Error in smart chat:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;