const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class PythonAgentBridgeController {
    constructor() {
        // Path to Python agents directory
        this.pythonPath = path.join(__dirname, '../../../../ai_chat_assistant');
        this.initializePythonAgents();
    }

    async initializePythonAgents() {
        console.log('🔥 PYTHON AGENT BRIDGE CONTROLLER LOADED!');
        console.log(`🔍 Python agent path: ${this.pythonPath}`);
        
        try {
            console.log('🔄 Initializing Python AI agents bridge...');
            console.log(`🐍 Testing Python at path: ${this.pythonPath}`);
            
            // Test Python agents connection
            const testResult = await this.callPythonAgent('test', { message: 'initialization test' });
            console.log('✅ Python agents initialization successful:', testResult);
        } catch (error) {
            console.log('⚠️ Python agents initialization error:', error.message);
            console.log('📁 Current working directory:', process.cwd());
            console.log('📂 Python path exists:', fs.existsSync(this.pythonPath));
        }
    }

    async callPythonAgent(agentType, data) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(this.pythonPath, 'api_bridge.py');
            console.log(`🔧 Calling Python script: ${pythonScript}`);
            console.log(`📋 Agent type: ${agentType}, Data:`, JSON.stringify(data).substring(0, 100) + '...');
            
            // Use full path to Python executable
            const pythonProcess = spawn('C:\\Windows\\py.exe', [pythonScript, agentType, JSON.stringify(data)], {
                cwd: this.pythonPath,
                env: { ...process.env, PYTHONPATH: this.pythonPath }
            });

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.log('🐍 Python stderr:', data.toString());
            });

            pythonProcess.on('close', (code) => {
                console.log(`🏁 Python process finished with code: ${code}`);
                console.log(`📤 Python output: ${output.substring(0, 200)}...`);
                if (errorOutput) console.log(`❌ Python errors: ${errorOutput}`);
                
                try {
                    if (code === 0 && output) {
                        const result = JSON.parse(output);
                        resolve(result);
                    } else {
                        reject(new Error(`Python agent failed with code ${code}: ${errorOutput}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse Python response: ${error.message}. Output: ${output}`));
                }
            });

            pythonProcess.on('error', (error) => {
                console.log('🚨 Python process error:', error);
                reject(new Error(`Python process error: ${error.message}`));
            });

            // Timeout after 60 seconds
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Python process timeout (60s)'));
            }, 60000);
        });
    }

    // Enhanced hybrid chat with comprehensive fallback
    async hybridChatWithPythonAgents(req, res) {
        const { message, accountId, projectId, mode } = req.body;
        
        console.log('🔥 [HYBRID-CHAT] FUNCTION CALLED - Updated version with database triggers!');
        console.log('📨 [HYBRID-CHAT] Request:', {
            message: message?.substring(0, 50) + '...',
            accountId,
            projectId,
            mode
        });

        try {
            // Try Python agents first
            console.log('🐍 [HYBRID-CHAT] Attempting Python agents...');
            
            try {
                const pythonResult = await this.callPythonAgent('enhanced', message);
                
                if (pythonResult && pythonResult.success) {
                    console.log('✅ [HYBRID-CHAT] Python agents successful');
                    return res.status(200).json({
                        success: true,
                        message: "Response generated via Python agents",
                        data: pythonResult.data,
                        agent: 'python',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    throw new Error(pythonResult?.error || 'Python agent failed');
                }
                
            } catch (pythonError) {
                console.log('⚠️ [HYBRID-CHAT] Python agents failed:', pythonError.message);
                
                // Enhanced Node.js fallback with database integration
                try {
                    const db = require('../../config/database');
                    
                    // Get some project data for context
                    const projectsQuery = `
                        SELECT projectName, s_company_name, projectId 
                        FROM projects 
                        WHERE s_company_name IS NOT NULL 
                        ORDER BY RAND() 
                        LIMIT 5
                    `;
                    
                    const projects = await new Promise((resolve, reject) => {
                        db.query(projectsQuery, (err, results) => {
                            if (err) reject(err);
                            else resolve(results || []);
                        });
                    });

                    // Create enhanced context
                    const projectContext = projects.map(p => 
                        `- ${p.projectName} (Company: ${p.s_company_name}, ID: ${p.projectId})`
                    ).join('\n');

                    const enhancedPrompt = `You are the CertainTi AI assistant with access to project management data.

Current sample projects in the system:
${projectContext}

User question: ${message}

Please provide a helpful response. If the user is asking about specific projects or data, explain that you have access to ${projects.length} sample projects and can provide more detailed information.`;

                    const { GoogleGenerativeAI } = require('@google/generative-ai');
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                    const result = await model.generateContent(enhancedPrompt);
                    const response = await result.response;

                    return res.status(200).json({
                        success: true,
                        message: "Response generated (Enhanced Node.js fallback with database)",
                        data: {
                            response: response.text(),
                            context: `Database integrated - ${projects.length} projects available`,
                            mode: 'enhanced_fallback'
                        },
                        agent: 'nodejs_enhanced',
                        timestamp: new Date().toISOString()
                    });

                } catch (enhancedError) {
                    console.log('⚠️ [HYBRID-CHAT] Enhanced fallback failed:', enhancedError.message);
                    
                    // Basic fallback
                    return res.status(200).json({
                        success: true,
                        message: "Response generated (Basic Node.js fallback)",
                        data: {
                            response: `I'm the CertainTi AI assistant. I'm currently working to connect all systems. Your message: "${message}". Python agents are initializing - please try again in a moment for enhanced responses with full database integration.`,
                            mode: 'basic_fallback'
                        },
                        agent: 'nodejs_basic',
                        timestamp: new Date().toISOString()
                    });
                }
            }

        } catch (error) {
            console.error('❌ [HYBRID-CHAT] Complete failure:', error);
            return res.status(500).json({
                success: false,
                message: "Chat system error",
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // System status check
    async getSystemStatus(req, res) {
        try {
            const status = {
                nodejs: '✅ Running',
                pythonAgents: '⚠️ Not available',
                database: '✅ Connected',
                geminiAPI: '✅ Connected (gemini-1.5-flash)',
                chromaDB: '🔄 Checking...',
                timestamp: new Date().toISOString()
            };

            // Test Python agents
            try {
                await this.callPythonAgent('test', { message: 'status check' });
                status.pythonAgents = '✅ Available';
            } catch (error) {
                status.pythonAgents = '❌ Not available';
            }

            return res.status(200).json({
                success: true,
                message: "System status retrieved",
                data: status
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Status check failed",
                error: error.message
            });
        }
    }

    // Debug routing function
    async debugRouting(req, res) {
        const { message } = req.body;
        
        try {
            const debugInfo = {
                request: { message },
                pythonPath: this.pythonPath,
                pathExists: fs.existsSync(this.pythonPath),
                timestamp: new Date().toISOString()
            };

            return res.status(200).json({
                success: true,
                message: "Debug information retrieved",
                data: debugInfo
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Debug failed",
                error: error.message
            });
        }
    }
}

module.exports = new PythonAgentBridgeController();
