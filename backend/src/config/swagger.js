const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "OrbitFlow Distributed Job Scheduler API",
            version: "1.0.0",
            description: "Production-ready background job scheduling platform API documentation.",
            contact: {
                name: "Kamal Sai",
                email: "kamal@example.com"
            }
        },
        servers: [
            {
                url: "http://localhost:5000/api",
                description: "Local development server"
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ]
    },
    apis: [] // We will define routes explicitly inside the spec if needed, or document here
};

// We can define the path definitions directly for maximum reliability and zero dependency on JSDoc comments matching
options.definition.paths = {
    "/auth/register": {
        post: {
            summary: "Register a new user",
            tags: ["Authentication"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["full_name", "email", "password"],
                            properties: {
                                full_name: { type: "string" },
                                email: { type: "string" },
                                password: { type: "string" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "User registered successfully" }
            }
        }
    },
    "/auth/login": {
        post: {
            summary: "Log in user and retrieve token",
            tags: ["Authentication"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string" },
                                password: { type: "string" }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "Login successful" }
            }
        }
    },
    "/organizations": {
        post: {
            summary: "Create a new organization",
            tags: ["Organizations"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["name"],
                            properties: {
                                name: { type: "string" },
                                description: { type: "string" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "Organization created" }
            }
        },
        get: {
            summary: "Get all organizations",
            tags: ["Organizations"],
            responses: {
                200: { description: "List of organizations" }
            }
        }
    },
    "/projects": {
        post: {
            summary: "Create a project in an organization",
            tags: ["Projects"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["organization_id", "name"],
                            properties: {
                                organization_id: { type: "integer" },
                                name: { type: "string" },
                                description: { type: "string" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "Project created" }
            }
        },
        get: {
            summary: "Get projects by organization",
            tags: ["Projects"],
            parameters: [
                {
                    name: "organization_id",
                    in: "query",
                    schema: { type: "integer" }
                }
            ],
            responses: {
                200: { description: "List of projects" }
            }
        }
    },
    "/queues": {
        post: {
            summary: "Create a job queue",
            tags: ["Queues"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["project_id", "queue_name"],
                            properties: {
                                project_id: { type: "integer" },
                                queue_name: { type: "string" },
                                priority: { type: "integer" },
                                concurrency_limit: { type: "integer" },
                                retry_policy_id: { type: "integer" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "Queue created" }
            }
        },
        get: {
            summary: "Get all queues",
            tags: ["Queues"],
            responses: {
                200: { description: "List of queues" }
            }
        }
    },
    "/jobs": {
        post: {
            summary: "Submit a new background job (Immediate, Scheduled, Cron, or Batch)",
            tags: ["Jobs"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                queue_id: { type: "integer" },
                                job_name: { type: "string" },
                                payload: { type: "object" },
                                priority: { type: "integer" },
                                delay_seconds: { type: "integer" },
                                scheduled_time: { type: "string" },
                                cron_expression: { type: "string" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "Job enqueued/scheduled" }
            }
        },
        get: {
            summary: "Retrieve background jobs",
            tags: ["Jobs"],
            parameters: [
                { name: "queue_id", in: "query", schema: { type: "integer" } },
                { name: "status", in: "query", schema: { type: "string" } },
                { name: "search", in: "query", schema: { type: "string" } },
                { name: "page", in: "query", schema: { type: "integer" } }
            ],
            responses: {
                200: { description: "List of jobs" }
            }
        }
    },
    "/workers": {
        get: {
            summary: "List all active workers and status",
            tags: ["Workers"],
            responses: {
                200: { description: "Workers list" }
            }
        }
    },
    "/dashboard/stats": {
        get: {
            summary: "Retrieve general dashboard statistics",
            tags: ["Dashboard"],
            responses: {
                200: { description: "Dashboard counters" }
            }
        }
    }
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
