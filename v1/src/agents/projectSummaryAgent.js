/**
 * Project Summary Agent
 * 
 * This agent fetches project summaries from the master_project_ai_summary table
 * and uses LLM to answer queries based on the project-specific summary data.
 * 
 * Table Structure: master_project_ai_summary
 * - id: varchar(128) PK
 * - intent_framework_id: varchar(128)
 * - companyId: varchar(128)
 * - projectId: varchar(128)
 * - projectCode: varchar(128)
 * - summary: text (main project summary content)
 * - status: varchar(16)
 * - createdtime: timestamp
 * - createdby: varchar(36)
 * - modifiedtime: timestamp
 * - modifiedby: varchar(36)
 * - sysmodtime: timestamp
 * - summary_identifier: int AI
 */

const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class ProjectSummaryAgent {
    constructor() {
        this.dbConfig = {
            host: process.env.DB_HOST || '40.76.85.4',
            user: process.env.DB_USER || 'ksrct_interns',
            password: process.env.DB_PASSWORD || 'Interns2025!',
            database: process.env.DB_NAME || 'certaintiMaster',
            port: process.env.DB_PORT || 3306,
            connectionLimit: 10,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            idleTimeout: 300000,
            maxReconnects: 3,
            multipleStatements: false
        };
        
        // Initialize LLM (using Gemini as fallback)
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDTcPwst2wT-eyYJvGaYFGo7S97CrSc2qw');
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        this.connectionPool = null;
        this.initializeDatabase();
    }

    /**
     * Initialize database connection pool with enhanced error handling
     */
    async initializeDatabase() {
        try {
            this.connectionPool = mysql.createPool(this.dbConfig);
            
            // Test the connection
            const connection = await this.connectionPool.getConnection();
            await connection.ping();
            connection.release();
            
            console.log('✅ Project Summary Agent: Database connection pool initialized');
            
            // Handle pool errors
            this.connectionPool.on('error', (err) => {
                console.error('❌ Database pool error:', err);
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.log('🔄 Attempting to reconnect...');
                    this.handleReconnection();
                }
            });
            
        } catch (error) {
            console.error('❌ Project Summary Agent: Database initialization failed:', error);
        }
    }

    /**
     * Handle database reconnection
     */
    async handleReconnection() {
        try {
            await this.connectionPool.end();
            this.connectionPool = mysql.createPool(this.dbConfig);
            console.log('✅ Database reconnected successfully');
        } catch (error) {
            console.error('❌ Database reconnection failed:', error);
        }
    }

    /**
     * Execute database query with retry logic
     */
    async executeQuery(query, params = [], maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (!this.connectionPool) {
                    await this.initializeDatabase();
                }
                
                const [rows] = await this.connectionPool.execute(query, params);
                return rows;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ Database query attempt ${attempt} failed:`, error.message);
                
                if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ENOTFOUND') {
                    console.log(`🔄 Connection error detected, retrying... (${attempt}/${maxRetries})`);
                    
                    if (attempt < maxRetries) {
                        // Wait before retry (exponential backoff)
                        await this.sleep(1000 * Math.pow(2, attempt - 1));
                        
                        // Recreate connection pool
                        try {
                            await this.connectionPool.end();
                        } catch (e) {
                            // Ignore errors when ending pool
                        }
                        this.connectionPool = null;
                        await this.initializeDatabase();
                    }
                } else {
                    // Non-connection error, don't retry
                    break;
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            const connection = await this.connectionPool.getConnection();
            await connection.ping();
            connection.release();
            return true;
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            return false;
        }
    }

    /**
     * Fetch project summary by project ID
     * @param {string} projectId - The project ID to fetch summary for
     * @returns {Object} Project summary data
     */
    async fetchProjectSummary(projectId) {
        try {
            if (!projectId) {
                throw new Error('Project ID is required');
            }

            console.log(`🔍 Fetching project summary for ID: ${projectId}`);

            // First try to get AI-generated summary
            // Enhanced query to handle different project ID formats and get latest summary
            const query = `
                SELECT 
                    id,
                    intent_framework_id,
                    companyId,
                    projectId,
                    projectCode,
                    summary,
                    status,
                    createdtime,
                    createdby,
                    modifiedtime,
                    modifiedby,
                    summary_identifier
                FROM master_project_ai_summary 
                WHERE (projectId = ? OR projectId = CONCAT('3', ?) OR projectId = LPAD(?, 6, '0') OR projectCode = ?) 
                AND status = 'active'
                ORDER BY modifiedtime DESC
                LIMIT 1
            `;

            const rows = await this.executeQuery(query, [projectId, projectId, projectId, projectId]);
            
            console.log(`📊 Found ${rows.length} matching project summaries for ID: ${projectId}`);
            
            if (rows.length > 0) {
                // AI summary found
                const projectSummary = rows[0];
                console.log(`✅ Using latest summary for project ${projectSummary.projectId} (modified: ${projectSummary.modifiedtime})`);
                
                return {
                    success: true,
                    message: 'AI project summary retrieved successfully',
                    data: {
                        id: projectSummary.id,
                        projectId: projectSummary.projectId,
                        projectCode: projectSummary.projectCode,
                        companyId: projectSummary.companyId,
                        summary: projectSummary.summary,
                        status: projectSummary.status,
                        lastModified: projectSummary.modifiedtime || projectSummary.createdtime,
                        source: 'ai_summary'
                    }
                };
            }
            
            // No AI summary found, try to get basic project info
            const basicProjectQuery = `
                SELECT 
                    projectId,
                    projectCode,
                    projectName,
                    companyId,
                    projectType,
                    projectStatus,
                    startDate,
                    endDate,
                    totalBudget,
                    projectManager,
                    createdTime,
                    modifiedTime
                FROM projects 
                WHERE projectId = ?
                LIMIT 1
            `;
            
            const projectRows = await this.executeQuery(basicProjectQuery, [projectId]);
            
            if (projectRows.length > 0) {
                const project = projectRows[0];
                
                // Generate a basic summary from project data
                const basicSummary = this.generateBasicSummary(project);
                
                return {
                    success: true,
                    message: 'Basic project information retrieved successfully',
                    data: {
                        projectId: project.projectId,
                        projectCode: project.projectCode,
                        companyId: project.companyId,
                        summary: basicSummary,
                        status: 'basic_info',
                        lastModified: project.modifiedTime || project.createdTime,
                        source: 'basic_project_data',
                        rawProjectData: project
                    }
                };
            }
            
            console.log(`❌ No project summary found for ID: ${projectId}`);
            
            // Try to suggest similar project IDs
            try {
                const suggestionQuery = `
                    SELECT DISTINCT projectId, projectCode 
                    FROM master_project_ai_summary 
                    WHERE status = 'active' 
                    AND (projectId LIKE ? OR projectCode LIKE ?)
                    ORDER BY modifiedtime DESC 
                    LIMIT 5
                `;
                const suggestions = await this.executeQuery(suggestionQuery, [`%${projectId}%`, `%${projectId}%`]);
                
                if (suggestions.length > 0) {
                    const suggestionList = suggestions.map(s => `${s.projectId} (${s.projectCode})`).join(', ');
                    console.log(`💡 Similar projects found: ${suggestionList}`);
                }
            } catch (suggestionError) {
                console.log('Could not fetch suggestions:', suggestionError.message);
            }
            
            return {
                success: false,
                message: `No summary found for project ID: ${projectId}`,
                data: null
            };

        } catch (error) {
            console.error('❌ Error fetching project summary:', error);
            return {
                success: false,
                message: 'Database error occurred while fetching project summary',
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Generate a basic summary from project data when AI summary is not available
     */
    generateBasicSummary(project) {
        const summary = [];
        
        summary.push(`**${project.projectName || 'Project ' + project.projectId}**`);
        summary.push('');
        
        if (project.projectType) {
            summary.push(`**Type:** ${project.projectType}`);
        }
        
        if (project.projectStatus) {
            summary.push(`**Status:** ${project.projectStatus}`);
        }
        
        if (project.startDate) {
            summary.push(`**Start Date:** ${new Date(project.startDate).toLocaleDateString()}`);
        }
        
        if (project.endDate) {
            summary.push(`**End Date:** ${new Date(project.endDate).toLocaleDateString()}`);
        }
        
        if (project.totalBudget) {
            summary.push(`**Budget:** $${Number(project.totalBudget).toLocaleString()}`);
        }
        
        if (project.totalCost) {
            summary.push(`**Total Cost:** $${Number(project.totalCost).toLocaleString()}`);
        }
        
        if (project.projectManager) {
            summary.push(`**Project Manager:** ${project.projectManager}`);
        }
        
        summary.push('');
        summary.push('*Note: This is basic project information. A detailed AI-generated summary may not be available for this project yet.*');
        
        return summary.join('\n');
    }

    /**
     * Get all project summaries for a company
     * @param {string} companyId - The company ID
     * @returns {Array} List of project summaries
     */
    async fetchCompanyProjectSummaries(companyId) {
        try {
            if (!companyId) {
                throw new Error('Company ID is required');
            }

            const query = `
                SELECT 
                    id,
                    projectId,
                    projectCode,
                    summary,
                    status,
                    modifiedtime
                FROM master_project_ai_summary 
                WHERE companyId = ? 
                AND status = 'active'
                ORDER BY modifiedtime DESC
            `;

            const rows = await this.executeQuery(query, [companyId]);
            
            return {
                success: true,
                message: `Found ${rows.length} project summaries for company ${companyId}`,
                data: rows.map(row => ({
                    id: row.id,
                    projectId: row.projectId,
                    projectCode: row.projectCode,
                    summary: row.summary.substring(0, 200) + '...', // Truncated summary
                    status: row.status,
                    lastModified: row.modifiedtime
                }))
            };

        } catch (error) {
            console.error('❌ Error fetching company project summaries:', error);
            return {
                success: false,
                message: 'Failed to fetch company project summaries',
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Answer user queries based on project summary using LLM
     * @param {string} projectId - The project ID
     * @param {string} userQuery - User's question
     * @returns {Object} LLM response based on project summary
     */
    async answerQuery(projectId, userQuery) {
        try {
            // First, fetch the project summary
            const summaryResult = await this.fetchProjectSummary(projectId);
            
            if (!summaryResult.success) {
                return {
                    success: false,
                    message: summaryResult.message,
                    answer: "I couldn't find a summary for this project. Please make sure the project ID is correct and the summary exists in the database."
                };
            }

            const projectData = summaryResult.data;
            
            // Prepare the prompt for LLM
            const prompt = `
You are an AI assistant specialized in analyzing project summaries. Based on the following project information, please answer the user's question accurately and comprehensively.

PROJECT INFORMATION:
- Project ID: ${projectData.projectId}
- Project Code: ${projectData.projectCode}
- Company ID: ${projectData.companyId}
- Last Updated: ${projectData.lastModified}

PROJECT SUMMARY:
${projectData.summary}

USER QUESTION: ${userQuery}

Please provide a detailed and helpful answer based on the project summary. If the question cannot be answered from the summary, please clearly state that and suggest what additional information might be needed.

Format your response in a clear, professional manner with relevant details from the project summary.
`;

            // Generate response using LLM
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const answer = response.text();

            return {
                success: true,
                message: 'Query answered successfully',
                answer: answer,
                projectInfo: {
                    projectId: projectData.projectId,
                    projectCode: projectData.projectCode,
                    lastUpdated: projectData.lastModified
                }
            };

        } catch (error) {
            console.error('❌ Error answering query:', error);
            return {
                success: false,
                message: 'Failed to process query',
                error: error.message,
                answer: "I'm sorry, I encountered an error while processing your question. Please try again or contact support if the issue persists."
            };
        }
    }

    /**
     * Convert HTML content to readable Markdown format
     * @param {string} htmlContent - HTML content to convert
     * @returns {string} Formatted Markdown content
     */
    convertHtmlToMarkdown(htmlContent) {
        if (!htmlContent) return 'No content available.';
        
        let markdown = htmlContent
            // Convert headers
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
            .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
            .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
            
            // Convert paragraphs
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
            
            // Convert lists
            .replace(/<ul[^>]*>/gi, '\n')
            .replace(/<\/ul>/gi, '\n')
            .replace(/<ol[^>]*>/gi, '\n')
            .replace(/<\/ol>/gi, '\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
            
            // Convert emphasis
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            
            // Convert links
            .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            
            // Convert line breaks
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<hr[^>]*>/gi, '\n---\n')
            
            // Remove remaining HTML tags
            .replace(/<[^>]*>/gi, '')
            
            // Clean up extra whitespace
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .replace(/^\s+|\s+$/g, '')
            .trim();

        // Add emojis to section headers for better visual appeal
        markdown = markdown
            .replace(/^### Brief project description/gm, '📝 **Brief Project Description**')
            .replace(/^### Problem statement being addressed/gm, '❓ **Problem Statement**')
            .replace(/^### Description of technology used or developed/gm, '💻 **Technology Used**')
            .replace(/^### Required Resources/gm, '🔧 **Required Resources**')
            .replace(/^### Team Members and Roles/gm, '👥 **Team Members and Roles**')
            .replace(/^### Milestones/gm, '🎯 **Milestones**')
            .replace(/^### Key Challenges and Focus Areas/gm, '⚡ **Key Challenges**')
            .replace(/^### Details of experimentation and R&D activities/gm, '🔬 **R&D Activities**')
            .replace(/^### Scalability and Future Growth/gm, '📈 **Scalability & Growth**')
            .replace(/^### Progress Tracking and Reporting/gm, '📊 **Progress Tracking**')
            .replace(/^### Project Timeline/gm, '⏱️ **Project Timeline**')
            .replace(/^### Commentary on research and development involved/gm, '💡 **R&D Commentary**');

        return markdown;
    }

    /**
     * Format project summary for display in chat
     * @param {string} projectId - The project ID
     * @returns {Object} Formatted project summary
     */
    async getFormattedSummary(projectId) {
        try {
            const summaryResult = await this.fetchProjectSummary(projectId);
            
            if (!summaryResult.success) {
                return {
                    success: false,
                    message: summaryResult.message,
                    formattedSummary: "No summary available for this project."
                };
            }

            const projectData = summaryResult.data;
            
            // Convert HTML summary to Markdown format
            const cleanSummary = this.convertHtmlToMarkdown(projectData.summary);
            
            // Format the summary for chat display
            const formattedSummary = `
📋 **Project Summary**

**Project Details:**
- 🆔 Project ID: \`${projectData.projectId}\`
- 📝 Project Code: \`${projectData.projectCode}\`
- 🏢 Company ID: \`${projectData.companyId}\`
- 📅 Last Updated: ${new Date(projectData.lastModified).toLocaleDateString()}

${cleanSummary}

---
*This summary was last updated on ${new Date(projectData.lastModified).toLocaleString()}*
`;

            return {
                success: true,
                message: 'Summary formatted successfully',
                formattedSummary: formattedSummary,
                rawData: projectData
            };

        } catch (error) {
            console.error('❌ Error formatting summary:', error);
            return {
                success: false,
                message: 'Failed to format summary',
                error: error.message,
                formattedSummary: "Error loading project summary."
            };
        }
    }

    /**
     * Health check for the agent
     * @returns {Object} Health status
     */
    async healthCheck() {
        try {
            const dbConnected = await this.testConnection();
            
            return {
                success: true,
                status: 'healthy',
                services: {
                    database: dbConnected ? 'connected' : 'disconnected',
                    llm: 'available',
                    agent: 'running'
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Close database connections
     */
    async close() {
        if (this.connectionPool) {
            await this.connectionPool.end();
            console.log('✅ Project Summary Agent: Database connections closed');
        }
    }
}

// Export the agent class
module.exports = ProjectSummaryAgent;

// Export singleton instance for direct use
const projectSummaryAgentInstance = new ProjectSummaryAgent();
module.exports.instance = projectSummaryAgentInstance;

// Export main functions for direct access
module.exports.fetchProjectSummary = (projectId) => projectSummaryAgentInstance.fetchProjectSummary(projectId);
module.exports.answerQuery = (projectId, userQuery) => projectSummaryAgentInstance.answerQuery(projectId, userQuery);
module.exports.getFormattedSummary = (projectId) => projectSummaryAgentInstance.getFormattedSummary(projectId);
module.exports.healthCheck = () => projectSummaryAgentInstance.healthCheck();