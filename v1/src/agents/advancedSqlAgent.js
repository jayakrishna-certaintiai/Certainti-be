/**
 * Advanced SQL Agent
 * 
 * Enhanced SQL agent with multi-table support, query optimization, security features,
 * and comprehensive error handling. Integrates with the Certainti database and
 * provides intelligent SQL query generation and execution.
 * 
 * Features:
 * - Multi-table query support with intelligent joins
 * - Query caching and optimization
 * - Enhanced security with parameterized queries
 * - Query history and analytics
 * - Performance monitoring
 * - Advanced error handling and recovery
 */

const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class AdvancedSqlAgent {
    constructor() {
        // Enhanced database configuration with robust connection settings
        this.dbConfig = {
            host: process.env.DB_HOST || '40.76.85.4',
            user: process.env.DB_USER || 'ksrct_interns',
            password: process.env.DB_PASSWORD || 'Interns2025!',
            database: process.env.DB_NAME || 'certaintiMaster',
            port: process.env.DB_PORT || 3306,
            connectionLimit: 20,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true,
            maxReconnects: 3,
            idleTimeout: 300000,
            ssl: false
        };
        
        // Initialize LLM
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Query cache for performance
        this.queryCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        // Query history for analytics
        this.queryHistory = [];
        this.maxHistorySize = 1000;
        
        // Performance metrics
        this.metrics = {
            totalQueries: 0,
            successfulQueries: 0,
            failedQueries: 0,
            averageExecutionTime: 0,
            cacheHits: 0
        };
        
        this.connectionPool = null;
        this.tableSchemas = new Map();
        this.initializeDatabase();
        this.loadTableSchemas();
    }

    /**
     * Execute query with retry logic and robust error handling
     */
    async executeQuery(sql, params = []) {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const [rows] = await this.connectionPool.execute(sql, params);
                return rows;
            } catch (error) {
                console.error(`❌ Advanced SQL Agent: Query execution attempt ${retryCount + 1} failed:`, error.message);
                
                // Check if it's a connection-related error
                if ((error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || 
                     error.code === 'ETIMEDOUT' || error.code === 'EPIPE') && retryCount < maxRetries - 1) {
                    
                    retryCount++;
                    console.log(`🔄 Advanced SQL Agent: Retrying query (attempt ${retryCount + 1}/${maxRetries})...`);
                    
                    // Wait with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                    
                    // Try to recreate the connection pool if needed
                    if (retryCount === 2) {
                        try {
                            console.log('🔄 Advanced SQL Agent: Recreating connection pool...');
                            await this.connectionPool.end();
                            await this.initializeDatabase();
                        } catch (poolError) {
                            console.error('❌ Advanced SQL Agent: Failed to recreate connection pool:', poolError);
                        }
                    }
                    continue;
                }
                
                // If not a connection error or max retries reached, throw the error
                throw error;
            }
        }
    }

    /**
     * Enhanced database initialization with connection pooling and error handling
     */
    async initializeDatabase() {
        try {
            this.connectionPool = mysql.createPool(this.dbConfig);
            
            // Set up pool error handling
            this.connectionPool.on('error', (err) => {
                console.error('❌ Advanced SQL Agent: Database pool error:', err);
                if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
                    console.log('🔄 Advanced SQL Agent: Attempting to reconnect...');
                    setTimeout(() => this.initializeDatabase(), 2000);
                }
            });

            console.log('✅ Advanced SQL Agent: Database connection pool initialized');
            
            // Test connection
            const testConnection = await this.connectionPool.getConnection();
            await testConnection.ping();
            testConnection.release();
            console.log('✅ Advanced SQL Agent: Database connection test successful');
            
        } catch (error) {
            console.error('❌ Advanced SQL Agent: Database initialization failed:', error);
            throw error;
        }
    }

    /**
     * Load and cache table schemas for better performance
     */
    async loadTableSchemas() {
        try {
            // Get all table names
            const tables = await this.executeQuery(`
                SELECT TABLE_NAME, TABLE_COMMENT 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = ?
            `, [this.dbConfig.database]);
            
            // Load schema for each table
            for (const table of tables) {
                const tableName = table.TABLE_NAME;
                const columns = await this.executeQuery(`
                    SELECT 
                        COLUMN_NAME,
                        DATA_TYPE,
                        IS_NULLABLE,
                        COLUMN_KEY,
                        COLUMN_DEFAULT,
                        COLUMN_COMMENT
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                    ORDER BY ORDINAL_POSITION
                `, [this.dbConfig.database, tableName]);
                
                this.tableSchemas.set(tableName, {
                    name: tableName,
                    comment: table.TABLE_COMMENT,
                    columns: columns
                });
            }
            
            console.log(`✅ Advanced SQL Agent: Loaded schemas for ${tables.length} tables`);
            
        } catch (error) {
            console.error('❌ Advanced SQL Agent: Error loading table schemas:', error);
        }
    }

    /**
     * Enhanced category mapping with more intelligent categorization
     */
    getCategoryMapping() {
        return {
            "Company / Organization": {
                tables: [
                    "company", "platformconfig", "user_company_relations",
                    "system_country_currency", "system_role", "system_status",
                    "system_type", "system_survey_template", "countries",
                    "platformusers", "permissions", "loginhistory"
                ],
                keywords: ["company", "organization", "config", "system", "country", "currency", "platform", "user"]
            },
            "Users / Teams": {
                tables: [
                    "contacts", "contacts_backup_20250211", "contactsalary",
                    "teammembers", "teammembers_bkup20241029", "teammembers_stage",
                    "platformusers", "permissions", "loginhistory",
                    "recentlyviewed", "roles", "rolefeatures"
                ],
                keywords: ["user", "contact", "team", "member", "role", "permission", "login", "salary", "employee"]
            },
            "Projects": {
                tables: [
                    "projects", "projectmilestones", "portfolio_projects_rel", "portfolios",
                    "projectfinancialdaily", "s_projects", "temp_projectlist",
                    "master_case_project", "master_case_project_backup_20250219"
                ],
                keywords: ["project", "milestone", "portfolio", "financial", "budget", "case"]
            },
            "Timesheets": {
                tables: [
                    "timesheetdata", "timesheets", "timesheetsraw", "timesheettasks",
                    "timesheettaskscache", "timesheetuploadlog", "x_timesheet",
                    "s_teammembers"
                ],
                keywords: ["timesheet", "time", "hours", "task", "upload", "raw", "effort"]
            },
            "Reports / Summaries": {
                tables: [
                    "consolidated_summary", "mod_consolidated_summary", "reconciliations",
                    "master_sheets", "master_sheets_data", "activitylogs", "alerts",
                    "notes", "naggingdetails", "master_project_ai_summary",
                    "master_project_ai_summary_sections", "master_project_ai_summary_source",
                    "master_project_summarizer_logs", "master_project_summarizer_logs_bkup20241008"
                ],
                keywords: ["summary", "report", "consolidated", "reconciliation", "alert", "note", "activity", "sheet"]
            },
            "AI / Interactions": {
                tables: [
                    "interactions", "interactions_artifacts", "interactions_sent",
                    "master_ai_configurations", "master_ai_llm_logs", "master_ai_request",
                    "master_ai_knowledge_base", "master_project_ai_assessment",
                    "master_project_ai_interaction", "master_interactions", "master_interactions_qa"
                ],
                keywords: ["ai", "interaction", "artifact", "llm", "assessment", "configuration", "knowledge"]
            },
            "Cases": {
                tables: ["case", "master_case", "master_case_project", "master_case_project_backup_20250219"],
                keywords: ["case", "legal", "issue", "claim"]
            },
            "Documents": {
                tables: ["documents", "master_document_type_mapping"],
                keywords: ["document", "file", "upload", "attachment", "doc"]
            },
            "Surveys": {
                tables: [
                    "master_survey", "master_survey_answer", "master_survey_answer_batch",
                    "master_survey_assignment", "master_survey_control",
                    "system_survey_question", "get_survey_responses",
                    "batchupload_survey_responses", "vw_survey",
                    "master_survey_backup_20250219", "master_survey_bkup20241008",
                    "master_survey_bkup20250129", "master_survey_answer_bkup20241008",
                    "master_survey_answer_bkup20250129", "master_survey_control_backup_20250219",
                    "master_survey_control_bkup20241008"
                ],
                keywords: ["survey", "question", "answer", "response", "assignment", "batch"]
            },
            "Financial / Dynamics": {
                tables: [
                    "projectfinancialdaily", "contactsalary", "trd365_account_fiscal",
                    "trd365_accounts", "trd365_country", "trd365_project_fiscal",
                    "trd365_project_fiscal_resources", "trd365_projects", "trd365_resources"
                ],
                keywords: ["financial", "fiscal", "account", "salary", "cost", "revenue", "dynamics", "365"]
            },
            "Mappings / Configurations": {
                tables: [
                    "mapping", "master_company_mail_configuration", "master_company_mapper",
                    "master_mapper", "master_mapper_attributes", "workflow",
                    "master_intent", "master_intent_framework", "master_intent_framework_company"
                ],
                keywords: ["mapping", "mapper", "config", "workflow", "intent", "framework", "mail"]
            }
        };
    }

    /**
     * Intelligent category selection using keywords and context
     */
    async selectCategory(question) {
        const categories = this.getCategoryMapping();
        const questionLower = question.toLowerCase();
        
        let bestMatch = { category: null, score: 0 };
        
        for (const [categoryName, categoryData] of Object.entries(categories)) {
            let score = 0;
            
            // Check for keyword matches
            for (const keyword of categoryData.keywords) {
                if (questionLower.includes(keyword)) {
                    score += keyword.length; // Longer keywords get more weight
                }
            }
            
            if (score > bestMatch.score) {
                bestMatch = { category: categoryName, score };
            }
        }
        
        // If no clear category, use LLM for classification
        if (bestMatch.score === 0) {
            const prompt = `
Categorize this database question into one of these categories:
${Object.keys(categories).join(', ')}

Question: "${question}"

Respond with only the category name.`;
            
            try {
                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                const categoryName = response.text().trim();
                
                if (categories[categoryName]) {
                    return { category: categoryName, tables: categories[categoryName].tables };
                }
            } catch (error) {
                console.error('Error in LLM category selection:', error);
            }
        }
        
        return bestMatch.category 
            ? { category: bestMatch.category, tables: categories[bestMatch.category].tables }
            : { category: "General", tables: Array.from(this.tableSchemas.keys()) };
    }

    /**
     * Advanced table selection with multi-table support
     */
    async selectTables(question, availableTables) {
        const questionLower = question.toLowerCase();
        const selectedTables = new Set();
        
        // Direct keyword to table mapping for better accuracy
        const keywordTableMap = {
            'company': ['company'],
            'companies': ['company'],
            'organization': ['company'],
            'project': ['projects'],
            'projects': ['projects'],
            'contact': ['contacts'],
            'contacts': ['contacts'],
            'user': ['contacts', 'platformusers'],
            'users': ['contacts', 'platformusers'],
            'team': ['teammembers'],
            'teams': ['teammembers'],
            'timesheet': ['timesheettasks', 'timesheets'],
            'timesheets': ['timesheettasks', 'timesheets'],
            'survey': ['master_survey', 'master_survey_answer'],
            'surveys': ['master_survey', 'master_survey_answer'],
            'summary': ['master_project_ai_summary', 'consolidated_summary'],
            'summaries': ['master_project_ai_summary', 'consolidated_summary'],
            'financial': ['projectfinancialdaily', 'contactsalary'],
            'cost': ['projectfinancialdaily'],
            'salary': ['contactsalary'],
            'document': ['documents'],
            'documents': ['documents'],
            'case': ['master_case', 'master_case_project'],
            'cases': ['master_case', 'master_case_project']
        };
        
        // Check for direct keyword matches first
        for (const [keyword, tables] of Object.entries(keywordTableMap)) {
            if (questionLower.includes(keyword)) {
                tables.forEach(table => {
                    if (availableTables.includes(table)) {
                        selectedTables.add(table);
                    }
                });
            }
        }
        
        // If no direct matches, use scoring system
        if (selectedTables.size === 0) {
            const tableScores = [];
            
            for (const tableName of availableTables) {
                let score = 0;
                const schema = this.tableSchemas.get(tableName);
                
                if (!schema) continue;
                
                // Check table name relevance
                if (questionLower.includes(tableName.toLowerCase())) {
                    score += 20;
                }
                
                // Check for partial table name matches
                const tableNameParts = tableName.toLowerCase().split('_');
                for (const part of tableNameParts) {
                    if (questionLower.includes(part) && part.length > 3) {
                        score += 10;
                    }
                }
                
                // Check column name relevance
                for (const column of schema.columns) {
                    const columnName = column.COLUMN_NAME.toLowerCase();
                    if (questionLower.includes(columnName)) {
                        score += 8;
                    }
                    
                    // Check for common patterns
                    if (columnName.includes('name') && questionLower.includes('name')) {
                        score += 5;
                    }
                    if (columnName.includes('count') && (questionLower.includes('how many') || questionLower.includes('count'))) {
                        score += 5;
                    }
                }
                
                if (score > 0) {
                    tableScores.push({ table: tableName, score });
                }
            }
            
            // Sort by score and select top tables
            tableScores.sort((a, b) => b.score - a.score);
            
            // Add top scoring tables (max 3 tables for performance)
            for (let i = 0; i < Math.min(3, tableScores.length); i++) {
                selectedTables.add(tableScores[i].table);
            }
        }
        
        // Always include 'projects' table if asking about projects and it's available
        if ((questionLower.includes('project') || questionLower.includes('how many')) && 
            availableTables.includes('projects')) {
            selectedTables.add('projects');
        }
        
        // Ensure we have at least one table
        if (selectedTables.size === 0 && availableTables.length > 0) {
            // Default to the first available table
            selectedTables.add(availableTables[0]);
        }
        
        const result = Array.from(selectedTables).slice(0, 3); // Limit to 3 tables max
        console.log(`🎯 Table selection for "${question}": ${result.join(', ')}`);
        return result;
    }

    /**
     * Generate optimized schema information for selected tables
     */
    getSchemaInfo(tableNames) {
        let schemaInfo = '';
        
        for (const tableName of tableNames) {
            const schema = this.tableSchemas.get(tableName);
            if (!schema) continue;
            
            schemaInfo += `\nTable: ${tableName}\n`;
            if (schema.comment) {
                schemaInfo += `Description: ${schema.comment}\n`;
            }
            
            schemaInfo += 'Columns:\n';
            for (const column of schema.columns) {
                schemaInfo += `  - ${column.COLUMN_NAME} (${column.DATA_TYPE})`;
                if (column.COLUMN_KEY === 'PRI') schemaInfo += ' [PRIMARY KEY]';
                if (column.COLUMN_KEY === 'MUL') schemaInfo += ' [FOREIGN KEY]';
                if (column.COLUMN_COMMENT) schemaInfo += ` // ${column.COLUMN_COMMENT}`;
                schemaInfo += '\n';
            }
        }
        
        return schemaInfo;
    }

    /**
     * Advanced SQL query generation with optimization hints
     */
    async generateSqlQuery(question, tableNames, schemaInfo) {
        const prompt = `
You are an expert SQL developer working with a MySQL database called "certaintiMaster". Generate an optimized SQL query for the following question.

CRITICAL REQUIREMENTS:
1. Use EXACT table names and column names as provided in the schema - DO NOT make up table names
2. The actual table for companies is called "company" (NOT "companies")
3. Common column patterns:
   - Company names: companyName (in company table)
   - Project names: projectName (in projects table)  
   - Contact names: firstName, lastName (in contacts table)
   - IDs typically end with "Id" (companyId, projectId, contactId)
4. Use proper JOINs when querying multiple tables
5. Add appropriate WHERE conditions only if the question specifies filters
6. Use LIMIT for potentially large result sets (default 50)
7. Make string comparisons case-insensitive using LOWER()
8. Format dates properly for MySQL
9. Use aliases for better readability
10. Avoid SELECT * unless specifically asked

Available Tables and Schema:
${schemaInfo}

Question: ${question}

Examples of correct table usage:
- For companies: SELECT companyName FROM company LIMIT 50;
- For projects: SELECT projectName FROM projects LIMIT 50;
- For contacts: SELECT firstName, lastName FROM contacts LIMIT 50;

Generate ONLY the SQL query without any explanations, markdown formatting, or comments.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let query = response.text().trim();
            
            // Clean up the query
            query = query.replace(/```sql\s*|\s*```/g, '').trim();
            query = query.replace(/^sql\s*/i, '').trim();
            query = query.replace(/```/g, '').trim();
            
            // Additional validation - ensure we're using correct table names
            const incorrectTables = ['companies', 'users', 'employees', 'timesheets_data'];
            const correctMappings = {
                'companies': 'company',
                'users': 'contacts',
                'employees': 'contacts', 
                'timesheets_data': 'timesheetdata'
            };
            
            for (const [incorrect, correct] of Object.entries(correctMappings)) {
                const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
                query = query.replace(regex, correct);
            }
            
            return query;
        } catch (error) {
            console.error('Error generating SQL query:', error);
            
            // Handle quota exceeded error specifically
            if (error.status === 429) {
                console.log('🚫 Gemini API quota exceeded, using fallback direct database query');
                return this.generateFallbackQuery(question, relevantTables);
            }
            
            throw new Error('Failed to generate SQL query');
        }
    }

    /**
     * Generate fallback query when AI is unavailable (quota exceeded)
     */
    generateFallbackQuery(question, relevantTables) {
        const questionLower = question.toLowerCase();
        
        // Simple pattern matching for common queries
        if (questionLower.includes('summary') && relevantTables.includes('master_project_ai_summary')) {
            return 'SELECT projectId, summary FROM master_project_ai_summary WHERE status = "active" LIMIT 10';
        }
        
        if (questionLower.includes('how many') || questionLower.includes('count')) {
            const table = relevantTables[0] || 'company';
            return `SELECT COUNT(*) as count FROM ${table}`;
        }
        
        if (questionLower.includes('list') || questionLower.includes('show')) {
            const table = relevantTables[0] || 'company';
            if (table === 'company') {
                return 'SELECT companyId, companyName, status FROM company LIMIT 20';
            } else if (table === 'project') {
                return 'SELECT projectId, projectName, projectStatus FROM project LIMIT 20';
            }
        }
        
        // Default fallback - show table structure
        const table = relevantTables[0] || 'company';
        return `SELECT * FROM ${table} LIMIT 5`;
    }

    /**
     * Validate and optimize SQL query
     */
    validateAndOptimizeQuery(query) {
        // Remove dangerous keywords
        const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
        const queryUpper = query.toUpperCase();
        
        for (const keyword of dangerousKeywords) {
            if (queryUpper.includes(keyword)) {
                throw new Error(`Query contains prohibited keyword: ${keyword}`);
            }
        }
        
        // Add LIMIT if not present and query looks like it might return many rows
        if (!queryUpper.includes('LIMIT') && queryUpper.includes('SELECT')) {
            // Check if it's not an aggregate query
            if (!queryUpper.includes('COUNT(') && !queryUpper.includes('SUM(') && 
                !queryUpper.includes('AVG(') && !queryUpper.includes('GROUP BY')) {
                query += ' LIMIT 100';
            }
        }
        
        return query;
    }

    /**
     * Execute SQL query with caching and performance monitoring
     */
    async executeSqlQuery(query, useCache = true) {
        const startTime = Date.now();
        this.metrics.totalQueries++;
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(query);
            if (useCache && this.queryCache.has(cacheKey)) {
                const cachedData = this.queryCache.get(cacheKey);
                if (Date.now() - cachedData.timestamp < this.cacheTimeout) {
                    this.metrics.cacheHits++;
                    return {
                        success: true,
                        data: cachedData.result,
                        executionTime: Date.now() - startTime,
                        fromCache: true
                    };
                } else {
                    this.queryCache.delete(cacheKey);
                }
            }
            
            // Execute query with retry logic
            const rows = await this.executeQuery(query);
            
            const executionTime = Date.now() - startTime;
            
            // Cache result if successful and not too large
            if (useCache && rows.length > 0 && rows.length < 1000) {
                this.queryCache.set(cacheKey, {
                    result: rows,
                    timestamp: Date.now()
                });
                
                // Clean cache if it gets too large
                if (this.queryCache.size > 100) {
                    const oldestKey = this.queryCache.keys().next().value;
                    this.queryCache.delete(oldestKey);
                }
            }
            
            // Update metrics
            this.metrics.successfulQueries++;
            this.updateAverageExecutionTime(executionTime);
            
            // Add to query history
            this.addToQueryHistory(query, true, executionTime, rows.length);
            
            return {
                success: true,
                data: rows,
                executionTime,
                fromCache: false,
                rowCount: rows.length
            };
            
        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.metrics.failedQueries++;
            this.addToQueryHistory(query, false, executionTime, 0, error.message);
            
            console.error('SQL execution error:', error);
            
            // Provide more specific error messages
            let errorMessage = error.message;
            if (error.code === 'ER_NO_SUCH_TABLE') {
                errorMessage = `Table doesn't exist. Please check the table name. Available tables include: company, projects, contacts, teammembers, etc.`;
            } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
                errorMessage = `Database connection timeout. The query may be too complex or the database is temporarily unavailable.`;
            } else if (error.code === 'ER_BAD_FIELD_ERROR') {
                errorMessage = `Column doesn't exist. Please check the column name in the table schema.`;
            }
            
            return {
                success: false,
                error: errorMessage,
                errorCode: error.code,
                executionTime
            };
        }
    }

    /**
     * Generate natural language response from query results
     */
    async generateResponse(question, query, queryResult) {
        if (!queryResult.success) {
            return `I encountered an error while executing your query: ${queryResult.error}. Please try rephrasing your question or contact support if the issue persists.`;
        }
        
        if (!queryResult.data || queryResult.data.length === 0) {
            return `I couldn't find any data matching your question: "${question}". The query executed successfully but returned no results.`;
        }
        
        // Limit data for LLM processing
        const limitedData = queryResult.data.slice(0, 50); // Process max 50 rows
        const dataString = JSON.stringify(limitedData, null, 2);
        
        const prompt = `
You are a data analyst. Based on the user's question and the SQL query results, provide a clear, natural language answer.

User Question: ${question}
SQL Query: ${query}
Query Results (${queryResult.data.length} rows${queryResult.fromCache ? ', from cache' : ''}):
${dataString.length > 4000 ? dataString.substring(0, 4000) + '...' : dataString}

Provide a comprehensive answer that:
1. Directly answers the user's question
2. Highlights key insights from the data
3. Mentions the total number of records if relevant
4. Uses clear, business-friendly language

Do not mention technical details like SQL queries or cache status unless relevant.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let answer = response.text().trim();
            
            // Add performance info for complex queries
            if (queryResult.executionTime > 1000) {
                answer += `\n\n*Query executed in ${queryResult.executionTime}ms*`;
            }
            
            return answer;
            
        } catch (error) {
            console.error('Error generating response:', error);
            return `I found ${queryResult.data.length} records matching your question, but I'm having trouble interpreting the results. Please contact support for assistance.`;
        }
    }

    /**
     * Main method to process natural language questions
     */
    async processQuestion(question) {
        try {
            console.log(`🤖 Processing question: ${question}`);
            
            // Step 1: Select category and tables
            const categoryResult = await this.selectCategory(question);
            console.log(`📂 Category: ${categoryResult.category}`);
            
            // Step 2: Select relevant tables
            const selectedTables = await this.selectTables(question, categoryResult.tables);
            console.log(`📋 Selected tables: ${selectedTables.join(', ')}`);
            
            // Step 3: Get schema information
            const schemaInfo = this.getSchemaInfo(selectedTables);
            
            // Step 4: Generate SQL query
            const sqlQuery = await this.generateSqlQuery(question, selectedTables, schemaInfo);
            console.log(`🔍 Generated query: ${sqlQuery}`);
            
            // Step 5: Validate and optimize query
            const optimizedQuery = this.validateAndOptimizeQuery(sqlQuery);
            
            // Step 6: Execute query
            const queryResult = await this.executeSqlQuery(optimizedQuery);
            
            // Step 7: Generate natural language response
            const response = await this.generateResponse(question, optimizedQuery, queryResult);
            
            return {
                success: true,
                question: question,
                category: categoryResult.category,
                tables: selectedTables,
                query: optimizedQuery,
                executionTime: queryResult.executionTime,
                rowCount: queryResult.rowCount || 0,
                fromCache: queryResult.fromCache || false,
                response: response
            };
            
        } catch (error) {
            console.error('Error processing question:', error);
            return {
                success: false,
                question: question,
                error: error.message,
                response: `I'm sorry, I encountered an error while processing your question: "${question}". Please try rephrasing your question or contact support if the issue persists.`
            };
        }
    }

    /**
     * Health check with comprehensive status
     */
    async healthCheck() {
        try {
            // Test database connection
            const testResult = await this.executeQuery('SELECT 1 as test');
            
            // Test LLM
            const testLLMResult = await this.model.generateContent("Test message");
            const testResponse = await testLLMResult.response;
            
            return {
                success: true,
                status: 'healthy',
                services: {
                    database: 'connected',
                    llm: 'available',
                    agent: 'running'
                },
                metrics: this.metrics,
                cacheSize: this.queryCache.size,
                tablesLoaded: this.tableSchemas.size,
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
     * Utility methods
     */
    generateCacheKey(query) {
        return Buffer.from(query).toString('base64').substring(0, 50);
    }

    updateAverageExecutionTime(newTime) {
        if (this.metrics.successfulQueries === 1) {
            this.metrics.averageExecutionTime = newTime;
        } else {
            this.metrics.averageExecutionTime = 
                (this.metrics.averageExecutionTime * (this.metrics.successfulQueries - 1) + newTime) 
                / this.metrics.successfulQueries;
        }
    }

    addToQueryHistory(query, success, executionTime, rowCount, error = null) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            query: query.substring(0, 200), // Truncate long queries
            success,
            executionTime,
            rowCount,
            error
        };
        
        this.queryHistory.push(historyEntry);
        
        // Maintain history size limit
        if (this.queryHistory.length > this.maxHistorySize) {
            this.queryHistory.shift();
        }
    }

    /**
     * Get analytics and performance data
     */
    getAnalytics() {
        return {
            metrics: this.metrics,
            cacheStatus: {
                size: this.queryCache.size,
                hitRate: this.metrics.totalQueries > 0 
                    ? (this.metrics.cacheHits / this.metrics.totalQueries * 100).toFixed(2) + '%'
                    : '0%'
            },
            recentQueries: this.queryHistory.slice(-10),
            tableStats: {
                totalTables: this.tableSchemas.size,
                loadedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.queryCache.clear();
        return { success: true, message: 'Cache cleared successfully' };
    }

    /**
     * Close connections
     */
    async close() {
        if (this.connectionPool) {
            await this.connectionPool.end();
            console.log('✅ Advanced SQL Agent: Database connections closed');
        }
    }
}

module.exports = AdvancedSqlAgent;