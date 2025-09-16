/**
 * Advanced SQL Agent API Routes
 * 
 * Provides REST API endpoints for the Advanced SQL Agent
 * Enables natural language to SQL query processing with enhanced features
 */

const express = require('express');
const router = express.Router();
const AdvancedSqlAgent = require('../agents/advancedSqlAgent');

/**
 * Initialize SQL Agent instance
 */
let sqlAgentInstance = null;

async function getSqlAgentInstance() {
    if (!sqlAgentInstance) {
        sqlAgentInstance = new AdvancedSqlAgent();
        // Give it a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return sqlAgentInstance;
}

/**
 * @route GET /api/v1/sql-agent/health
 * @desc Health check for SQL agent
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const sqlAgent = await getSqlAgentInstance();
        const healthStatus = await sqlAgent.healthCheck();
        
        if (healthStatus.success) {
            res.status(200).json({
                success: true,
                message: 'Advanced SQL Agent is healthy',
                data: healthStatus,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                success: false,
                message: 'Advanced SQL Agent is unhealthy',
                error: healthStatus.error,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('SQL Agent health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/v1/sql-agent/query
 * @desc Process natural language question and return SQL results
 * @access Private (requires authentication)
 * @body {
 *   question: string,
 *   useCache?: boolean,
 *   includeQuery?: boolean
 * }
 */
router.post('/query', async (req, res) => {
    try {
        const { question, useCache = true, includeQuery = false } = req.body;
        
        // Validate input
        if (!question || typeof question !== 'string' || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Question is required and must be a non-empty string',
                required: ['question'],
                timestamp: new Date().toISOString()
            });
        }
        
        // Rate limiting check (simple implementation)
        const userIP = req.ip || req.connection.remoteAddress;
        if (!req.rateLimitBypass && isRateLimited(userIP)) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please wait before making another query.',
                timestamp: new Date().toISOString()
            });
        }
        
        const sqlAgent = await getSqlAgentInstance();
        const result = await sqlAgent.processQuestion(question.trim());
        
        // Prepare response
        const response = {
            success: result.success,
            message: result.success ? 'Query processed successfully' : 'Query processing failed',
            data: {
                question: result.question,
                response: result.response,
                category: result.category,
                tables: result.tables,
                executionTime: result.executionTime,
                rowCount: result.rowCount,
                fromCache: result.fromCache
            },
            timestamp: new Date().toISOString()
        };
        
        // Include SQL query if requested and successful
        if (includeQuery && result.success && result.query) {
            response.data.sqlQuery = result.query;
        }
        
        // Include error details if failed
        if (!result.success && result.error) {
            response.error = result.error;
        }
        
        const statusCode = result.success ? 200 : 400;
        res.status(statusCode).json(response);
        
    } catch (error) {
        console.error('SQL Agent query error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while processing query',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/v1/sql-agent/direct-sql
 * @desc Execute direct SQL query (for admin users only)
 * @access Admin only
 * @body {
 *   query: string,
 *   useCache?: boolean
 * }
 */
router.post('/direct-sql', async (req, res) => {
    try {
        const { query, useCache = false } = req.body;
        
        // Check if user is admin (implement your auth logic here)
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
                timestamp: new Date().toISOString()
            });
        }
        
        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'SQL query is required and must be a non-empty string',
                required: ['query'],
                timestamp: new Date().toISOString()
            });
        }
        
        const sqlAgent = await getSqlAgentInstance();
        
        // Validate and execute query
        try {
            const validatedQuery = sqlAgent.validateAndOptimizeQuery(query.trim());
            const result = await sqlAgent.executeSqlQuery(validatedQuery, useCache);
            
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: 'Query executed successfully',
                    data: {
                        query: validatedQuery,
                        results: result.data,
                        executionTime: result.executionTime,
                        rowCount: result.rowCount,
                        fromCache: result.fromCache
                    },
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Query execution failed',
                    error: result.error,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (validationError) {
            res.status(400).json({
                success: false,
                message: 'Query validation failed',
                error: validationError.message,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('Direct SQL execution error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while executing query',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/v1/sql-agent/analytics
 * @desc Get SQL agent analytics and performance metrics
 * @access Admin only
 */
router.get('/analytics', async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
                timestamp: new Date().toISOString()
            });
        }
        
        const sqlAgent = await getSqlAgentInstance();
        const analytics = sqlAgent.getAnalytics();
        
        res.status(200).json({
            success: true,
            message: 'Analytics retrieved successfully',
            data: analytics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Analytics retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving analytics',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/v1/sql-agent/clear-cache
 * @desc Clear SQL agent query cache
 * @access Admin only
 */
router.post('/clear-cache', async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
                timestamp: new Date().toISOString()
            });
        }
        
        const sqlAgent = await getSqlAgentInstance();
        const result = sqlAgent.clearCache();
        
        res.status(200).json({
            success: true,
            message: 'Cache cleared successfully',
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Cache clear error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cache',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/v1/sql-agent/tables
 * @desc Get available database tables and their schemas
 * @access Private
 */
router.get('/tables', async (req, res) => {
    try {
        const sqlAgent = await getSqlAgentInstance();
        const categories = sqlAgent.getCategoryMapping();
        
        // Get table schemas for response
        const tableSchemas = {};
        for (const [tableName, schema] of sqlAgent.tableSchemas.entries()) {
            tableSchemas[tableName] = {
                name: schema.name,
                comment: schema.comment,
                columnCount: schema.columns.length,
                primaryKeys: schema.columns.filter(col => col.COLUMN_KEY === 'PRI').map(col => col.COLUMN_NAME),
                foreignKeys: schema.columns.filter(col => col.COLUMN_KEY === 'MUL').map(col => col.COLUMN_NAME)
            };
        }
        
        res.status(200).json({
            success: true,
            message: 'Database tables retrieved successfully',
            data: {
                categories: categories,
                tableSchemas: tableSchemas,
                totalTables: Object.keys(tableSchemas).length
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Tables retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving database tables',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route POST /api/v1/sql-agent/chat
 * @desc Smart chat interface that combines context with SQL querying
 * @access Private
 * @body {
 *   message: string,
 *   conversationHistory?: Array,
 *   context?: Object
 * }
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [], context = {} } = req.body;
        
        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required and must be a non-empty string',
                required: ['message'],
                timestamp: new Date().toISOString()
            });
        }
        
        const sqlAgent = await getSqlAgentInstance();
        
        // Process the message as a SQL query
        const result = await sqlAgent.processQuestion(message.trim());
        
        // Prepare chat response
        let chatResponse = result.response;
        
        // Add context information if available
        if (context.companyName || context.projectName) {
            chatResponse += '\n\n---\n';
            if (context.companyName) {
                chatResponse += `*Company: ${context.companyName}*\n`;
            }
            if (context.projectName) {
                chatResponse += `*Project: ${context.projectName}*\n`;
            }
        }
        
        // Add performance info for transparency
        if (result.success && result.executionTime) {
            chatResponse += `\n*Query executed in ${result.executionTime}ms`;
            if (result.fromCache) {
                chatResponse += ' (cached result)';
            }
            chatResponse += '*';
        }
        
        res.status(200).json({
            success: true,
            message: 'Chat message processed successfully',
            data: {
                response: chatResponse,
                metadata: {
                    querySuccessful: result.success,
                    category: result.category,
                    tables: result.tables,
                    executionTime: result.executionTime,
                    rowCount: result.rowCount,
                    fromCache: result.fromCache
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('SQL Agent chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing chat message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Simple rate limiting implementation
 * In production, use Redis or a proper rate limiting library
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

function isRateLimited(ip) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];
    
    // Remove requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    
    // Clean up old entries periodically
    if (rateLimitMap.size > 1000) {
        const cutoff = now - RATE_LIMIT_WINDOW;
        for (const [key, requests] of rateLimitMap.entries()) {
            const validRequests = requests.filter(timestamp => timestamp > cutoff);
            if (validRequests.length === 0) {
                rateLimitMap.delete(key);
            } else {
                rateLimitMap.set(key, validRequests);
            }
        }
    }
    
    return false;
}

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
    console.error('SQL Agent router error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error in SQL Agent',
        error: error.message,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;